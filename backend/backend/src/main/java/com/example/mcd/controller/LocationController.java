package com.example.mcd.controller;

import com.example.mcd.model.Location;
import com.example.mcd.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "*") // Erlaubt Zugriff vom Frontend (auch von anderen Ports)
public class LocationController {

    @Autowired
    private LocationRepository locationRepository;

    @GetMapping
    public List<Location> getAllLocations() {
        System.out.println("API Aufruf: Lade alle Standorte aus der DB...");
        return locationRepository.findAll();
    }
}