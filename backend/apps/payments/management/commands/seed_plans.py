"""
Management command to seed initial subscription plans.
"""
from django.core.management.base import BaseCommand
from apps.payments.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed initial subscription plans'

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'Basic Plan',
                'description': 'Basic plan with limited features. Share up to 5 notes.',
                'price': 200.00,
                'note_limit': 10,
                'private_note_limit': 5,
                'is_unlimited': False,
            },
            {
                'name': 'Premium Plan',
                'description': 'Premium plan with unlimited features. Unlimited note sharing.',
                'price': 500.00,
                'note_limit': None,
                'private_note_limit': None,
                'is_unlimited': True,
            },
        ]
        
        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{status} plan: {plan.name} (Rs. {plan.price})')
            )
        
        self.stdout.write(self.style.SUCCESS('Done seeding plans!'))
