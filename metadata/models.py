from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class MetadataRecord(models.Model):
    """Core metadata record for compliance purposes"""
    
    CONTENT_TYPES = [
        ('post', 'Post'),
        ('message', 'Message'),
        ('board', 'Board'),
        ('user', 'User'),
        ('transaction', 'Transaction'),
        ('interaction', 'Interaction'),
    ]
    
    content_hash = models.CharField(max_length=64, unique=True, help_text="SHA256 hash of content")
    content_type = models.CharField(max_length=50, choices=CONTENT_TYPES, help_text="Type of content")
    timestamp = models.DateTimeField(auto_now_add=True, help_text="When metadata was recorded")
    user_address = models.CharField(max_length=44, help_text="Wallet address of user")
    ip_address = models.GenericIPAddressField(help_text="IP address of user")
    user_agent = models.TextField(help_text="User agent string")
    metadata_json = models.JSONField(help_text="Additional metadata in JSON format")
    is_encrypted = models.BooleanField(default=False, help_text="Whether metadata is encrypted")
    encryption_key_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID of encryption key used")
    
    class Meta:
        db_table = 'metadata_records'
        indexes = [
            models.Index(fields=['content_hash']),
            models.Index(fields=['user_address']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['content_type']),
        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.content_type}:{self.content_hash[:8]}... ({self.user_address[:8]}...)"

class AuditLog(models.Model):
    """Audit trail for compliance and policy enforcement"""
    
    ACTION_TYPES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('access', 'Access'),
        ('export', 'Export'),
        ('compliance_check', 'Compliance Check'),
        ('policy_violation', 'Policy Violation'),
    ]
    
    action = models.CharField(max_length=100, choices=ACTION_TYPES, help_text="Action performed")
    timestamp = models.DateTimeField(auto_now_add=True, help_text="When action occurred")
    user_address = models.CharField(max_length=44, help_text="Wallet address of user")
    ip_address = models.GenericIPAddressField(help_text="IP address of user")
    details = models.JSONField(help_text="Additional details about the action")
    authorized_by = models.CharField(max_length=100, help_text="Who authorized this action")
    is_compliant = models.BooleanField(default=True, help_text="Whether action was compliant")
    policy_reference = models.CharField(max_length=200, blank=True, help_text="Reference to policy document")
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['user_address']),
            models.Index(fields=['action']),
            models.Index(fields=['is_compliant']),
        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} by {self.user_address[:8]}... at {self.timestamp}"

class CompliancePolicy(models.Model):
    """Policies for compliance enforcement"""
    
    POLICY_TYPES = [
        ('data_retention', 'Data Retention'),
        ('access_control', 'Access Control'),
        ('privacy', 'Privacy'),
        ('security', 'Security'),
        ('regulatory', 'Regulatory'),
    ]
    
    name = models.CharField(max_length=200, help_text="Name of the policy")
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPES, help_text="Type of policy")
    description = models.TextField(help_text="Description of the policy")
    content = models.TextField(help_text="Full policy content")
    version = models.CharField(max_length=20, help_text="Policy version")
    effective_date = models.DateField(help_text="When policy becomes effective")
    is_active = models.BooleanField(default=True, help_text="Whether policy is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'compliance_policies'
        unique_together = ['name', 'version']
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.name} v{self.version}"

class DataRetentionRule(models.Model):
    """Rules for data retention and deletion"""
    
    content_type = models.CharField(max_length=50, choices=MetadataRecord.CONTENT_TYPES, help_text="Type of content")
    retention_period_days = models.IntegerField(help_text="How long to retain data in days")
    deletion_policy = models.CharField(max_length=100, help_text="How to handle deletion")
    is_encrypted = models.BooleanField(default=False, help_text="Whether to encrypt retained data")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'data_retention_rules'
        unique_together = ['content_type']
    
    def __str__(self):
        return f"{self.content_type}: {self.retention_period_days} days"

class ComplianceReport(models.Model):
    """Generated compliance reports"""
    
    REPORT_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
        ('on_demand', 'On Demand'),
    ]
    
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, help_text="Type of report")
    start_date = models.DateField(help_text="Start date for report period")
    end_date = models.DateField(help_text="End date for report period")
    generated_at = models.DateTimeField(auto_now_add=True, help_text="When report was generated")
    generated_by = models.CharField(max_length=100, help_text="Who generated the report")
    report_data = models.JSONField(help_text="Report data in JSON format")
    file_path = models.CharField(max_length=500, blank=True, help_text="Path to report file if saved")
    
    class Meta:
        db_table = 'compliance_reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.report_type} Report: {self.start_date} to {self.end_date}"
