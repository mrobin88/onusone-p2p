from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.http import JsonResponse
from django.core.exceptions import ValidationError
import json
import hashlib
import logging
from django.utils import timezone

from .models import MetadataRecord, AuditLog, CompliancePolicy, DataRetentionRule
from .serializers import MetadataRecordSerializer, AuditLogSerializer
from .utils import get_client_ip, validate_metadata, log_audit_event

logger = logging.getLogger(__name__)

class MetadataRateThrottle(UserRateThrottle):
    rate = '100/hour'  # Limit to 100 requests per hour per user

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([MetadataRateThrottle])
def store_metadata(request):
    """
    Store metadata for compliance purposes
    
    This endpoint stores metadata about user interactions for policy compliance.
    All metadata is logged and can be accessed by authorized entities.
    """
    try:
        # Extract data from request
        data = request.data
        user_address = data.get('user_address')
        content_type = data.get('content_type')
        content = data.get('content')
        additional_metadata = data.get('metadata', {})
        
        # Validate required fields
        if not all([user_address, content_type, content]):
            return Response({
                'error': 'Missing required fields: user_address, content_type, content'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate content hash
        content_hash = hashlib.sha256(str(content).encode()).hexdigest()
        
        # Get client IP and user agent
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Validate metadata
        if not validate_metadata(content_type, additional_metadata):
            return Response({
                'error': 'Invalid metadata format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create metadata record
        metadata_record = MetadataRecord.objects.create(
            content_hash=content_hash,
            content_type=content_type,
            user_address=user_address,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=additional_metadata
        )
        
        # Log audit event
        log_audit_event(
            action='create',
            user_address=user_address,
            ip_address=ip_address,
            details={
                'content_type': content_type,
                'content_hash': content_hash,
                'metadata_id': metadata_record.id
            },
            authorized_by='system'
        )
        
        return Response({
            'success': True,
            'metadata_id': metadata_record.id,
            'content_hash': content_hash,
            'message': 'Metadata stored successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error storing metadata: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_metadata(request, content_hash):
    """
    Retrieve metadata for authorized access
    
    This endpoint allows authorized entities to retrieve metadata
    for compliance and policy enforcement purposes.
    """
    try:
        # Check if metadata exists
        try:
            metadata_record = MetadataRecord.objects.get(content_hash=content_hash)
        except MetadataRecord.DoesNotExist:
            return Response({
                'error': 'Metadata not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Log access for audit trail
        log_audit_event(
            action='read',
            user_address=request.user.username if hasattr(request.user, 'username') else 'unknown',
            ip_address=get_client_ip(request),
            details={
                'content_hash': content_hash,
                'metadata_id': metadata_record.id
            },
            authorized_by='authenticated_user'
        )
        
        # Serialize and return metadata
        serializer = MetadataRecordSerializer(metadata_record)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error retrieving metadata: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_metadata(request):
    """
    List metadata records for administrative purposes
    
    This endpoint is restricted to admin users and provides
    a paginated list of metadata records.
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = min(int(request.GET.get('page_size', 50)), 100)  # Max 100 per page
        content_type = request.GET.get('content_type')
        user_address = request.GET.get('user_address')
        
        # Build query
        queryset = MetadataRecord.objects.all()
        
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        if user_address:
            queryset = queryset.filter(user_address__icontains=user_address)
        
        # Paginate results
        start = (page - 1) * page_size
        end = start + page_size
        metadata_records = queryset[start:end]
        
        # Serialize results
        serializer = MetadataRecordSerializer(metadata_records, many=True)
        
        return Response({
            'results': serializer.data,
            'page': page,
            'page_size': page_size,
            'total_count': queryset.count(),
            'has_next': end < queryset.count(),
            'has_previous': page > 1
        })
        
    except Exception as e:
        logger.error(f"Error listing metadata: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def export_metadata(request):
    """
    Export metadata for compliance reporting
    
    This endpoint allows administrators to export metadata
    for regulatory compliance and audit purposes.
    """
    try:
        # Get export parameters
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        content_types = request.data.get('content_types', [])
        format_type = request.data.get('format', 'json')
        
        # Validate dates
        if not start_date or not end_date:
            return Response({
                'error': 'Start date and end date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Build query
        queryset = MetadataRecord.objects.filter(
            timestamp__date__range=[start_date, end_date]
        )
        
        if content_types:
            queryset = queryset.filter(content_type__in=content_types)
        
        # Serialize data
        serializer = MetadataRecordSerializer(queryset, many=True)
        
        # Log export for audit trail
        log_audit_event(
            action='export',
            user_address=request.user.username if hasattr(request.user, 'username') else 'unknown',
            ip_address=get_client_ip(request),
            details={
                'start_date': start_date,
                'end_date': end_date,
                'content_types': content_types,
                'format': format_type,
                'record_count': queryset.count()
            },
            authorized_by='admin_user'
        )
        
        return Response({
            'success': True,
            'export_data': serializer.data,
            'metadata': {
                'start_date': start_date,
                'end_date': end_date,
                'content_types': content_types,
                'format': format_type,
                'record_count': queryset.count(),
                'exported_at': timezone.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error exporting metadata: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'details': str(e)}
        , status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compliance_status(request):
    """
    Get compliance status for the system
    
    This endpoint provides information about current compliance
    status and any policy violations.
    """
    try:
        # Get recent audit logs
        recent_audits = AuditLog.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        )
        
        # Check for policy violations
        violations = recent_audits.filter(is_compliant=False)
        
        # Get active policies
        active_policies = CompliancePolicy.objects.filter(is_active=True)
        
        return Response({
            'compliance_status': 'compliant' if not violations.exists() else 'violations_detected',
            'recent_audits': AuditLogSerializer(recent_audits[:10], many=True).data,
            'policy_violations': AuditLogSerializer(violations, many=True).data,
            'active_policies': active_policies.count(),
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting compliance status: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Health check endpoint
@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for monitoring
    """
    try:
        # Check database connectivity
        metadata_count = MetadataRecord.objects.count()
        audit_count = AuditLog.objects.count()
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'metadata_records': metadata_count,
            'audit_logs': audit_count,
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
