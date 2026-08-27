# Generated manually — consolidated migration for project lead fields
# Depends on 0124 which created TeamWork model tables.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0124_project_teamwork"),
    ]

    operations = [
        # Drop the old project_lead User FK column
        migrations.RemoveField(
            model_name="project",
            name="project_lead",
        ),
        # Add lead as User FK (auto-set to project creator)
        migrations.AddField(
            model_name="project",
            name="lead",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="project_lead",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Project Lead",
            ),
        ),
        # Add team_work_lead as TeamWork FK (Lead/Scrum Master dropdown)
        migrations.AddField(
            model_name="project",
            name="team_work_lead",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="team_work_lead_projects",
                to="db.teamwork",
                verbose_name="Lead / Scrum Master",
            ),
        ),
    ]
