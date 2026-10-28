package com.portfolio.employeemanagement.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("An employee with email address " + email + " already exists.");
    }
}
