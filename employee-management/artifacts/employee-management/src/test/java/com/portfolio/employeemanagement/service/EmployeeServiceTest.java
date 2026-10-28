package com.portfolio.employeemanagement.service;

import com.portfolio.employeemanagement.dto.EmployeeRequest;
import com.portfolio.employeemanagement.dto.EmployeeResponse;
import com.portfolio.employeemanagement.entity.Employee;
import com.portfolio.employeemanagement.entity.EmploymentStatus;
import com.portfolio.employeemanagement.exception.DuplicateEmailException;
import com.portfolio.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void createEmployeeTrimsFieldsAndNormalizesEmail() {
        EmployeeRequest request = request("  Alex Morgan  ", "  ALEX.MORGAN@example.com  ");
        when(employeeRepository.existsByEmailIgnoreCase("alex.morgan@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeResponse response = employeeService.createEmployee(request);

        assertEquals("Alex Morgan", response.name());
        assertEquals("alex.morgan@example.com", response.email());
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void createEmployeeRejectsDuplicateEmail() {
        when(employeeRepository.existsByEmailIgnoreCase("alex.morgan@example.com")).thenReturn(true);

        assertThrows(
                DuplicateEmailException.class,
                () -> employeeService.createEmployee(request("Alex Morgan", "alex.morgan@example.com"))
        );
    }

    private EmployeeRequest request(String name, String email) {
        return new EmployeeRequest(
                name,
                email,
                "+1 555 010 1042",
                "Engineering",
                "Software Engineer",
                new BigDecimal("8200.00"),
                LocalDate.of(2023, 6, 1),
                EmploymentStatus.ACTIVE
        );
    }
}
