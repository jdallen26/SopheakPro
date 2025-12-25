from django.shortcuts import render, get_object_or_404
from .models import Employee

def employee_list(request):
    qs = Employee.objects.all()[:200]
    return render(request, 'hr/employee_list.html', {'employees': qs})

def employee_detail(request, pk):
    emp = get_object_or_404(Employee, pk=pk)
    return render(request, 'hr/employee_detail.html', {'employee': emp})