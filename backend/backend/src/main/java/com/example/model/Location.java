package com.example.mcd.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Repräsentiert einen McDonald's Standort in der Datenbank.
 */
@Document(collection = "locations")
public class Location {

    @Id
    private String id;
    private String name;
    private double latitude;  // Breitengrad
    private double longitude; // Längengrad

    // Leerer Konstruktor für Spring/MongoDB
    public Location() {
    }

    // Konstruktor zum schnellen Erstellen
    public Location(String name, double latitude, double longitude) {
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // --- Getter und Setter ---

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    @Override
    public String toString() {
        return "Location{" +
                "name='" + name + '\'' +
                ", lat=" + latitude +
                ", lon=" + longitude +
                '}';
    }
}