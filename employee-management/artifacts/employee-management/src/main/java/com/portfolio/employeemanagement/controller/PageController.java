package com.portfolio.employeemanagement.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping({
            "/",
            "/employees",
            "/employees/new",
            "/employees/{id}/edit",
            "/departments"
    })
    public String appPage() {
        return "forward:/index.html";
    }
}
