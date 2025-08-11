from rest_framework import serializers
from .models import MetadataRecord, AuditLog, CompliancePolicy, DataRetentionRule, ComplianceReport

class MetadataRecordSerializer(serializers.ModelSerializer):
    """Serializer for MetadataRecord model"""
    
    class Meta:
        model = MetadataRecord
        fields = [
            'id', 'content_hash', 'content_type', 'timestamp', 'user_address',
            'ip_address', 'user_agent', 'metadata_json', 'is_encrypted',
            'encryption_key_id'
        ]
        read_only_fields = ['id', 'timestamp', 'ip_address', 'user_agent']
    
    def to_representation(self, instance):
        """Custom representation for sensitive data"""
        data = super().to_representation(instance)
        
        # Mask sensitive information for non-admin users
        if not self.context.get('is_admin', False):
            data['user_address'] = f"{data['user_address'][:8]}..."
            data['ip_address'] = self._mask_ip(data['ip_address'])
        
        return data
    
    def _mask_ip(self, ip_address):
        """Mask IP address for privacy"""
        if not ip_address:
            return ip_address
        
        parts = ip_address.split('.')
        if len(parts) == 4:  # IPv4
            return f"{parts[0]}.{parts[1]}.*.*"
        elif ':' in ip_address:  # IPv6
            return f"{ip_address[:8]}..."
        
        return ip_address

class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model"""
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'timestamp', 'user_address', 'ip_address',
            'details', 'authorized_by', 'is_compliant', 'policy_reference'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def to_representation(self, instance):
        """Custom representation for audit logs"""
        data = super().to_representation(instance)
        
        # Mask sensitive information for non-admin users
        if not self.context.get('is_admin', False):
            data['user_address'] = f"{data['user_address'][:8]}..."
            data['ip_address'] = self._mask_ip(data['ip_address'])
        
        return data
    
    def _mask_ip(self, ip_address):
        """Mask IP address for privacy"""
        if not ip_address:
            return ip_address
        
        parts = ip_address.split('.')
        if len(parts) == 4:  # IPv4
            return f"{parts[0]}.{parts[1]}.*.*"
        elif ':' in ip_address:  # IPv6
            return f"{ip_address[:8]}..."
        
        return ip_address

class CompliancePolicySerializer(serializers.ModelSerializer):
    """Serializer for CompliancePolicy model"""
    
    class Meta:
        model = CompliancePolicy
        fields = [
            'id', 'name', 'policy_type', 'description', 'content',
            'version', 'effective_date', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class DataRetentionRuleSerializer(serializers.ModelSerializer):
    """Serializer for DataRetentionRule model"""
    
    class Meta:
        model = DataRetentionRule
        fields = [
            'id', 'content_type', 'retention_period_days', 'deletion_policy',
            'is_encrypted', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ComplianceReportSerializer(serializers.ModelSerializer):
    """Serializer for ComplianceReport model"""
    
    class Meta:
        model = ComplianceReport
        fields = [
            'id', 'report_type', 'start_date', 'end_date', 'generated_at',
            'generated_by', 'report_data', 'file_path'
        ]
        read_only_fields = ['id', 'generated_at']

class MetadataCreateSerializer(serializers.Serializer):
    """Serializer for creating metadata records"""
    
    user_address = serializers.CharField(max_length=44, help_text="Wallet address of user")
    content_type = serializers.ChoiceField(choices=MetadataRecord.CONTENT_TYPES, help_text="Type of content")
    content = serializers.CharField(help_text="Content to hash and store")
    metadata = serializers.JSONField(required=False, default=dict, help_text="Additional metadata")
    
    def validate_user_address(self, value):
        """Validate wallet address format"""
        if not value or len(value) < 26 or len(value) > 44:
            raise serializers.ValidationError("Invalid wallet address format")
        return value
    
    def validate_content(self, value):
        """Validate content is not empty"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Content cannot be empty")
        return value
    
    def validate_metadata(self, value):
        """Validate metadata is a valid JSON object"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Metadata must be a JSON object")
        return value

class MetadataExportSerializer(serializers.Serializer):
    """Serializer for metadata export requests"""
    
    start_date = serializers.DateField(help_text="Start date for export period")
    end_date = serializers.DateField(help_text="End date for export period")
    content_types = serializers.ListField(
        child=serializers.ChoiceField(choices=MetadataRecord.CONTENT_TYPES),
        required=False,
        help_text="Content types to include in export"
    )
    format = serializers.ChoiceField(
        choices=['json', 'csv', 'xml'],
        default='json',
        help_text="Export format"
    )
    
    def validate(self, data):
        """Validate date range"""
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        
        # Check if date range is reasonable (not more than 1 year)
        from datetime import date
        if (data['end_date'] - data['start_date']).days > 365:
            raise serializers.ValidationError("Export period cannot exceed 1 year")
        
        return data

class ComplianceStatusSerializer(serializers.Serializer):
    """Serializer for compliance status responses"""
    
    compliance_status = serializers.CharField(help_text="Overall compliance status")
    recent_audits = AuditLogSerializer(many=True, help_text="Recent audit log entries")
    policy_violations = AuditLogSerializer(many=True, help_text="Recent policy violations")
    active_policies = serializers.IntegerField(help_text="Number of active policies")
    last_updated = serializers.DateTimeField(help_text="When status was last updated")

class HealthCheckSerializer(serializers.Serializer):
    """Serializer for health check responses"""
    
    status = serializers.CharField(help_text="System health status")
    database = serializers.CharField(help_text="Database connection status")
    metadata_records = serializers.IntegerField(help_text="Number of metadata records")
    audit_logs = serializers.IntegerField(help_text="Number of audit log entries")
    timestamp = serializers.DateTimeField(help_text="Health check timestamp")
