import csv
import json
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Any

def parse_csv_file(file_path: str, bank_type: str) -> List[Dict[str, Any]]:
    """
    Parse banking CSV file and return structured transaction data.
    Supports Visa and Mastercard formats.
    """
    transactions = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        for row in csv_reader:
            # Normalize column names based on bank type
            if bank_type.lower() == 'visa':
                transaction = {
                    'date': row.get('Transaction Date', row.get('Date', '')),
                    'description': row.get('Description', row.get('Merchant', '')),
                    'amount': float(row.get('Amount', row.get('Debit', row.get('Credit', 0)))),
                    'category': categorize_transaction(row.get('Description', '')),
                    'type': 'debit' if float(row.get('Amount', 0)) < 0 else 'credit'
                }
            elif bank_type.lower() == 'mastercard':
                transaction = {
                    'date': row.get('Date', row.get('Transaction Date', '')),
                    'description': row.get('Description', row.get('Merchant Name', '')),
                    'amount': float(row.get('Amount', row.get('Transaction Amount', 0))),
                    'category': categorize_transaction(row.get('Description', '')),
                    'type': 'debit' if float(row.get('Amount', 0)) < 0 else 'credit'
                }
            
            transactions.append(transaction)
    
    return transactions

def categorize_transaction(description: str) -> str:
    """
    Categorize transactions based on description keywords.
    """
    description_lower = description.lower()
    
    categories = {
        'groceries': ['grocery', 'supermarket', 'food', 'market', 'trader joe', 'whole foods', 'safeway'],
        'dining': ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'pizza', 'dining'],
        'transportation': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'metro'],
        'entertainment': ['netflix', 'spotify', 'hulu', 'movie', 'theater', 'concert', 'game'],
        'utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
        'shopping': ['amazon', 'target', 'walmart', 'mall', 'store', 'shop'],
        'healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'cvs', 'walgreens'],
        'travel': ['hotel', 'airline', 'flight', 'airbnb', 'booking'],
    }
    
    for category, keywords in categories.items():
        if any(keyword in description_lower for keyword in keywords):
            return category
    
    return 'other'

def analyze_spending_patterns(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze spending patterns and generate insights.
    """
    # Group by category
    category_totals = defaultdict(float)
    monthly_totals = defaultdict(float)
    
    for transaction in transactions:
        if transaction['type'] == 'debit':
            amount = abs(transaction['amount'])
            category_totals[transaction['category']] += amount
            
            # Extract month from date
            try:
                date_obj = datetime.strptime(transaction['date'], '%Y-%m-%d')
                month_key = date_obj.strftime('%Y-%m')
                monthly_totals[month_key] += amount
            except:
                pass
    
    # Calculate statistics
    total_spending = sum(category_totals.values())
    
    # Find top spending categories
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    # Calculate average monthly spending
    avg_monthly = sum(monthly_totals.values()) / len(monthly_totals) if monthly_totals else 0
    
    analysis = {
        'total_spending': round(total_spending, 2),
        'average_monthly_spending': round(avg_monthly, 2),
        'category_breakdown': {cat: round(amt, 2) for cat, amt in sorted_categories},
        'top_category': sorted_categories[0][0] if sorted_categories else 'none',
        'monthly_spending': {month: round(amt, 2) for month, amt in sorted(monthly_totals.items())},
        'transaction_count': len(transactions),
        'insights': generate_insights(category_totals, total_spending, avg_monthly)
    }
    
    return analysis

def generate_insights(category_totals: Dict[str, float], total_spending: float, avg_monthly: float) -> List[str]:
    """
    Generate personalized financial insights.
    """
    insights = []
    
    # Check for high spending categories
    for category, amount in category_totals.items():
        percentage = (amount / total_spending * 100) if total_spending > 0 else 0
        if percentage > 30:
            insights.append(f"Your {category} spending represents {percentage:.1f}% of your total expenses. Consider reviewing this category for potential savings.")
    
    # Dining out insight
    if 'dining' in category_totals and category_totals['dining'] > avg_monthly * 0.15:
        insights.append("Dining expenses are significant. Cooking at home more often could save you money.")
    
    # Entertainment insight
    if 'entertainment' in category_totals and category_totals['entertainment'] > avg_monthly * 0.10:
        insights.append("Entertainment subscriptions add up. Review which services you actively use.")
    
    # General savings insight
    if avg_monthly > 0:
        potential_savings = avg_monthly * 0.10
        insights.append(f"By reducing spending by just 10%, you could save ${potential_savings:.2f} per month.")
    
    return insights

def main():
    """
    Main function to demonstrate CSV processing.
    """
    # Example usage
    print("Banking CSV Processor Ready")
    print("This script processes Visa and Mastercard CSV files")
    print("Upload your CSV through the web interface to analyze your spending")

if __name__ == "__main__":
    main()
