# Example of how to pull data from one model and append related data from another model
#PayrollSites = apps.get_model('payroll', 'PayrollSites')

# cust_id = {t.cust_id for t in qs}
# site_info = {
#     s['cust_id']: {
#         'company': s['company'],
#         'taxable': s.get('taxable', False),
#         'cod': s.get('cod', False),
#         'voucher': s.get('voucher', False),
#         'mailto': s.get('mailto', False),
#         'other_bill': s.get('other_bill', False),
#         'adv_bill': s.get('adv_bill', False),
#     }
#     for s in PayrollSites.objects.filter(cust_id__in=cust_id).values(
#         'cust_id', 'company', 'taxable', 'cod', 'voucher', 'mailto', 'other_bill', 'adv_bill'
#     )
# }

#        data = [{
#             'id': task.id,
#             'cust_id': task.cust_id,
#             'company': site_info.company,
