import json
from datetime import datetime
from typing import Dict, List, Any
from collections import defaultdict

def generate_monthly_breakdown(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate detailed monthly spending breakdown with trends and comparisons.
    """
    monthly_data = defaultdict(lambda: {
        'total': 0,
        'categories': defaultdict(float),
        'transactions': []
    })
    
    # Group transactions by month
    for transaction in transactions:
        if transaction['type'] == 'debit':
            try:
                date_obj = datetime.strptime(transaction['date'], '%Y-%m-%d')
                month_key = date_obj.strftime('%Y-%m')
                amount = abs(transaction['amount'])
                
                monthly_data[month_key]['total'] += amount
                monthly_data[month_key]['categories'][transaction['category']] += amount
                monthly_data[month_key]['transactions'].append(transaction)
            except:
                continue
    
    # Calculate trends
    sorted_months = sorted(monthly_data.keys())
    trends = calculate_trends(monthly_data, sorted_months)
    
    # Format breakdown
    breakdown = {
        'months': {},
        'trends': trends,
        'summary': generate_summary(monthly_data, sorted_months)
    }
    
    for month in sorted_months:
        data = monthly_data[month]
        breakdown['months'][month] = {
            'total_spending': round(data['total'], 2),
            'category_breakdown': {cat: round(amt, 2) for cat, amt in data['categories'].items()},
            'transaction_count': len(data['transactions']),
            'top_expenses': get_top_expenses(data['transactions'], 5)
        }
    
    return breakdown

def calculate_trends(monthly_data: Dict, sorted_months: List[str]) -> Dict[str, Any]:
    """
    Calculate spending trends over time.
    """
    if len(sorted_months) < 2:
        return {'trend': 'insufficient_data'}
    
    # Compare last month to previous month
    last_month = monthly_data[sorted_months[-1]]['total']
    prev_month = monthly_data[sorted_months[-2]]['total']
    
    change = last_month - prev_month
    change_percent = (change / prev_month * 100) if prev_month > 0 else 0
    
    # Calculate average spending
    avg_spending = sum(data['total'] for data in monthly_data.values()) / len(monthly_data)
    
    return {
        'trend': 'increasing' if change > 0 else 'decreasing',
        'change_amount': round(change, 2),
        'change_percent': round(change_percent, 2),
        'average_monthly': round(avg_spending, 2),
        'highest_month': max(sorted_months, key=lambda m: monthly_data[m]['total']),
        'lowest_month': min(sorted_months, key=lambda m: monthly_data[m]['total'])
    }

def get_top_expenses(transactions: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get the top N expenses for a month.
    """
    sorted_transactions = sorted(transactions, key=lambda x: abs(x['amount']), reverse=True)
    return [
        {
            'description': t['description'],
            'amount': round(abs(t['amount']), 2),
            'category': t['category'],
            'date': t['date']
        }
        for t in sorted_transactions[:limit]
    ]

def generate_summary(monthly_data: Dict, sorted_months: List[str]) -> Dict[str, Any]:
    """
    Generate overall summary statistics.
    """
    total_all_time = sum(data['total'] for data in monthly_data.values())
    avg_monthly = total_all_time / len(monthly_data) if monthly_data else 0
    
    # Find most common category across all months
    all_categories = defaultdict(float)
    for data in monthly_data.values():
        for category, amount in data['categories'].items():
            all_categories[category] += amount
    
    top_category = max(all_categories.items(), key=lambda x: x[1])[0] if all_categories else 'none'
    
    return {
        'total_spending_all_time': round(total_all_time, 2),
        'average_monthly_spending': round(avg_monthly, 2),
        'months_analyzed': len(monthly_data),
        'top_spending_category': top_category,
        'recommendations': generate_recommendations(all_categories, avg_monthly)
    }

def generate_recommendations(categories: Dict[str, float], avg_monthly: float) -> List[str]:
    """
    Generate actionable recommendations based on spending patterns.
    """
    recommendations = []
    total = sum(categories.values())
    
    for category, amount in categories.items():
        percentage = (amount / total * 100) if total > 0 else 0
        
        if category == 'dining' and percentage > 20:
            recommendations.append("Consider meal prepping to reduce dining expenses")
        elif category == 'shopping' and percentage > 25:
            recommendations.append("Review shopping habits and create a budget for discretionary purchases")
        elif category == 'entertainment' and percentage > 15:
            recommendations.append("Audit entertainment subscriptions and cancel unused services")
        elif category == 'transportation' and percentage > 20:
            recommendations.append("Explore carpooling or public transit options to reduce transportation costs")
    
    # General savings recommendation
    potential_savings = avg_monthly * 0.20
    recommendations.append(f"Setting aside 20% of monthly spending (${potential_savings:.2f}) could build a strong emergency fund")
    
    return recommendations

def main():
    """
    Main function for monthly breakdown analysis.
    """
    print("Monthly Breakdown Analyzer Ready")
    print("This script generates detailed monthly spending reports")
    print("Provides trends, comparisons, and personalized recommendations")

if __name__ == "__main__":
    main()
