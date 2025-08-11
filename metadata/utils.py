import hashlib
import json
import logging
from django.http import HttpRequest
from django.utils import timezone
from .models import AuditLog

logger = logging.getLogger(__name__)

def get_client_ip(request: HttpRequest) -> str:
    """
    Get the client's IP address from the request
    
    Handles various proxy scenarios and returns the most likely real IP
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Get the first IP in the list (client IP)
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('HTTP_X_REAL_IP')
    
    if not ip:
        ip = request.META.get('REMOTE_ADDR')
    
    # Validate IP format
    if not ip or ip == 'unknown':
        ip = '127.0.0.1'  # Default to localhost if unknown
    
    return ip

def validate_metadata(content_type: str, metadata: dict) -> bool:
    """
    Validate metadata format and content
    
    Ensures metadata follows required schema for each content type
    """
    try:
        # Basic validation
        if not isinstance(metadata, dict):
            return False
        
        # Content type specific validation
        if content_type == 'post':
            required_fields = ['title', 'board_slug']
            return all(field in metadata for field in required_fields)
        
        elif content_type == 'message':
            required_fields = ['thread_id', 'parent_id']
            return all(field in metadata for field in required_fields)
        
        elif content_type == 'board':
            required_fields = ['name', 'description']
            return all(field in metadata for field in required_fields)
        
        elif content_type == 'user':
            required_fields = ['username', 'display_name']
            return all(field in metadata for field in required_fields)
        
        elif content_type == 'transaction':
            required_fields = ['tx_hash', 'amount', 'token']
            return all(field in metadata for field in required_fields)
        
        elif content_type == 'interaction':
            required_fields = ['action', 'target_id']
            return all(field in metadata for field in required_fields)
        
        # Default validation for unknown content types
        return True
        
    except Exception as e:
        logger.error(f"Error validating metadata: {str(e)}")
        return False

def log_audit_event(action: str, user_address: str, ip_address: str, 
                   details: dict, authorized_by: str, is_compliant: bool = True,
                   policy_reference: str = None) -> AuditLog:
    """
    Log an audit event for compliance tracking
    
    Creates an audit log entry for all system actions
    """
    try:
        audit_log = AuditLog.objects.create(
            action=action,
            user_address=user_address,
            ip_address=ip_address,
            details=details,
            authorized_by=authorized_by,
            is_compliant=is_compliant,
            policy_reference=policy_reference
        )
        
        logger.info(f"Audit event logged: {action} by {user_address[:8]}...")
        return audit_log
        
    except Exception as e:
        logger.error(f"Error logging audit event: {str(e)}")
        # Return None if logging fails, but don't break the main flow
        return None

def hash_content(content: str) -> str:
    """
    Generate SHA256 hash of content
    
    Used for creating unique identifiers for content
    """
    if not content:
        return ""
    
    return hashlib.sha256(str(content).encode('utf-8')).hexdigest()

def encrypt_metadata(metadata: dict, key_id: str = None) -> tuple:
    """
    Encrypt sensitive metadata
    
    Returns encrypted data and key identifier
    """
    # For now, return as-is with encryption flag
    # In production, implement proper encryption
    return metadata, key_id or "default_key"

def decrypt_metadata(encrypted_data: dict, key_id: str) -> dict:
    """
    Decrypt encrypted metadata
    
    Returns decrypted data
    """
    # For now, return as-is
    # In production, implement proper decryption
    return encrypted_data

def check_compliance_policy(content_type: str, metadata: dict) -> tuple:
    """
    Check if metadata complies with current policies
    
    Returns (is_compliant, violations, policy_references)
    """
    violations = []
    policy_references = []
    
    try:
        # Check data retention policies
        from .models import DataRetentionRule
        retention_rules = DataRetentionRule.objects.filter(content_type=content_type)
        
        for rule in retention_rules:
            if rule.is_encrypted and not metadata.get('is_encrypted'):
                violations.append(f"Content type {content_type} requires encryption")
                policy_references.append(f"DataRetention:{rule.id}")
        
        # Check privacy policies
        if 'user_address' in metadata:
            # Ensure wallet addresses are properly formatted
            user_addr = metadata['user_address']
            if len(user_addr) < 26 or len(user_addr) > 44:
                violations.append("Invalid wallet address format")
                policy_references.append("Privacy:WalletAddressFormat")
        
        # Check security policies
        if 'ip_address' in metadata:
            ip = metadata['ip_address']
            if ip in ['0.0.0.0', '127.0.0.1', 'localhost']:
                violations.append("Invalid IP address")
                policy_references.append("Security:IPAddressValidation")
        
        is_compliant = len(violations) == 0
        
        return is_compliant, violations, policy_references
        
    except Exception as e:
        logger.error(f"Error checking compliance policy: {str(e)}")
        return False, ["Policy check failed"], []

def generate_compliance_report(start_date: str, end_date: str, 
                             content_types: list = None) -> dict:
    """
    Generate a compliance report for the specified period
    
    Returns comprehensive compliance data
    """
    try:
        from .models import MetadataRecord, AuditLog, CompliancePolicy
        
        # Convert string dates to date objects
        start = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        end = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get metadata records for the period
        metadata_query = MetadataRecord.objects.filter(
            timestamp__date__range=[start, end]
        )
        
        if content_types:
            metadata_query = metadata_query.filter(content_type__in=content_types)
        
        metadata_records = metadata_query
        total_records = metadata_records.count()
        
        # Get audit logs for the period
        audit_logs = AuditLog.objects.filter(timestamp__date__range=[start, end])
        
        # Get policy violations
        violations = audit_logs.filter(is_compliant=False)
        
        # Get active policies
        active_policies = CompliancePolicy.objects.filter(is_active=True)
        
        # Calculate compliance metrics
        total_actions = audit_logs.count()
        compliant_actions = audit_logs.filter(is_compliant=True).count()
        compliance_rate = (compliant_actions / total_actions * 100) if total_actions > 0 else 100
        
        # Generate report
        report = {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'metadata_summary': {
                'total_records': total_records,
                'content_types': list(metadata_records.values('content_type').annotate(
                    count=models.Count('id')
                )),
                'unique_users': metadata_records.values('user_address').distinct().count()
            },
            'audit_summary': {
                'total_actions': total_actions,
                'compliant_actions': compliant_actions,
                'violations': violations.count(),
                'compliance_rate': round(compliance_rate, 2)
            },
            'policy_summary': {
                'active_policies': active_policies.count(),
                'policy_types': list(active_policies.values('policy_type').annotate(
                    count=models.Count('id')
                ))
            },
            'generated_at': timezone.now().isoformat()
        }
        
        return report
        
    except Exception as e:
        logger.error(f"Error generating compliance report: {str(e)}")
        return {
            'error': 'Failed to generate report',
            'details': str(e)
        }

def cleanup_expired_metadata() -> dict:
    """
    Clean up expired metadata based on retention policies
    
    Returns cleanup summary
    """
    try:
        from .models import DataRetentionRule, MetadataRecord
        from django.utils import timezone
        
        cleanup_summary = {
            'records_processed': 0,
            'records_deleted': 0,
            'errors': []
        }
        
        # Get all retention rules
        retention_rules = DataRetentionRule.objects.all()
        
        for rule in retention_rules:
            try:
                # Calculate cutoff date
                cutoff_date = timezone.now() - timezone.timedelta(days=rule.retention_period_days)
                
                # Find expired records
                expired_records = MetadataRecord.objects.filter(
                    content_type=rule.content_type,
                    timestamp__lt=cutoff_date
                )
                
                count = expired_records.count()
                cleanup_summary['records_processed'] += count
                
                # Delete expired records
                if count > 0:
                    expired_records.delete()
                    cleanup_summary['records_deleted'] += count
                    
                    # Log cleanup action
                    log_audit_event(
                        action='delete',
                        user_address='system',
                        ip_address='127.0.0.1',
                        details={
                            'content_type': rule.content_type,
                            'records_deleted': count,
                            'retention_policy': rule.id
                        },
                        authorized_by='system',
                        is_compliant=True,
                        policy_reference=f"DataRetention:{rule.id}"
                    )
                
            except Exception as e:
                error_msg = f"Error processing rule {rule.id}: {str(e)}"
                cleanup_summary['errors'].append(error_msg)
                logger.error(error_msg)
        
        return cleanup_summary
        
    except Exception as e:
        logger.error(f"Error in cleanup_expired_metadata: {str(e)}")
        return {
            'error': 'Cleanup failed',
            'details': str(e)
        }
