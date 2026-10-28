package com.portfolio.employeemanagement.service;

import com.portfolio.employeemanagement.dto.DashboardStats;
import com.portfolio.employeemanagement.dto.DepartmentSummary;
import com.portfolio.employeemanagement.dto.EmployeeRequest;
import com.portfolio.employeemanagement.dto.EmployeeResponse;
import com.portfolio.employeemanagement.entity.Employee;
import com.portfolio.employeemanagement.entity.EmploymentStatus;
import com.portfolio.employeemanagement.exception.DuplicateEmailException;
import com.portfolio.employeemanagement.exception.EmployeeNotFoundException;
import com.portfolio.employeemanagement.repository.EmployeeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEmployees(
            String search,
            String department,
            EmploymentStatus status,
            String sortBy,
            String direction
    ) {
        Specification<Employee> specification = buildSpecification(search, department, status);
        Sort sort = buildSort(sortBy, direction);
        return employeeRepository.findAll(specification, sort).stream()
                .map(EmployeeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> searchEmployees(String search) {
        return getEmployees(search, null, null, "name", "asc");
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {
        return EmployeeResponse.from(findEmployee(id));
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        String email = normalizeEmail(request.email());
        if (employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException(email);
        }

        Employee employee = toEmployee(request, email);
        return EmployeeResponse.from(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = findEmployee(id);
        String email = normalizeEmail(request.email());
        if (employeeRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new DuplicateEmailException(email);
        }

        employee.update(
                clean(request.name()),
                email,
                clean(request.phone()),
                clean(request.department()),
                clean(request.designation()),
                request.salary(),
                request.joiningDate(),
                request.status()
        );
        return EmployeeResponse.from(employeeRepository.save(employee));
    }

    @Transactional
    public void deleteEmployee(Long id) {
        employeeRepository.delete(findEmployee(id));
    }

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        List<Employee> employees = employeeRepository.findAll();
        long total = employees.size();
        long active = employees.stream()
                .filter(employee -> employee.getStatus() == EmploymentStatus.ACTIVE)
                .count();
        long departments = departmentCounts(employees).size();
        BigDecimal average = total == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : employees.stream()
                        .map(Employee::getSalary)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
        return new DashboardStats(total, active, departments, average);
    }

    @Transactional(readOnly = true)
    public List<DepartmentSummary> getDepartments() {
        return departmentCounts(employeeRepository.findAll()).entrySet().stream()
                .map(entry -> new DepartmentSummary(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllForReport() {
        return employeeRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(EmployeeResponse::from)
                .toList();
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new EmployeeNotFoundException(id));
    }

    private Employee toEmployee(EmployeeRequest request, String email) {
        return new Employee(
                clean(request.name()),
                email,
                clean(request.phone()),
                clean(request.department()),
                clean(request.designation()),
                request.salary(),
                request.joiningDate(),
                request.status()
        );
    }

    private Specification<Employee> buildSpecification(
            String search,
            String department,
            EmploymentStatus status
    ) {
        Specification<Employee> specification = Specification.where(null);

        if (search != null && !search.isBlank()) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            Specification<Employee> byName = (root, query, builder) ->
                    builder.like(builder.lower(root.get("name")), "%" + term + "%");
            Specification<Employee> byId = parseId(term)
                    .<Specification<Employee>>map(id ->
                            (root, query, builder) -> builder.equal(root.get("id"), id))
                    .orElse((root, query, builder) -> builder.disjunction());
            specification = specification.and(byName.or(byId));
        }

        if (department != null && !department.isBlank()) {
            String normalizedDepartment = department.trim().toLowerCase(Locale.ROOT);
            specification = specification.and((root, query, builder) ->
                    builder.equal(builder.lower(root.get("department")), normalizedDepartment));
        }

        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }

        return specification;
    }

    private java.util.Optional<Long> parseId(String value) {
        try {
            return java.util.Optional.of(Long.parseLong(value));
        } catch (NumberFormatException exception) {
            return java.util.Optional.empty();
        }
    }

    private Sort buildSort(String sortBy, String direction) {
        String property = switch (sortBy == null ? "joiningDate" : sortBy) {
            case "name" -> "name";
            case "joiningDate" -> "joiningDate";
            default -> throw new IllegalArgumentException("Sort by name or joining date.");
        };

        Sort.Direction sortDirection = switch (direction == null ? "desc" : direction.toLowerCase(Locale.ROOT)) {
            case "asc" -> Sort.Direction.ASC;
            case "desc" -> Sort.Direction.DESC;
            default -> throw new IllegalArgumentException("Sort direction must be asc or desc.");
        };
        return Sort.by(sortDirection, property);
    }

    private Map<String, Long> departmentCounts(List<Employee> employees) {
        Map<String, Long> counts = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        employees.stream()
                .map(Employee::getDepartment)
                .map(EmployeeService::clean)
                .filter(department -> !department.isBlank())
                .forEach(department -> counts.merge(department, 1L, Long::sum));
        return counts;
    }

    private static String normalizeEmail(String email) {
        return clean(email).toLowerCase(Locale.ROOT);
    }

    private static String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
