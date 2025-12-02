package com.example.mcd;

import com.example.mcd.model.Location;
import com.example.mcd.repository.LocationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class McdAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(McdAppApplication.class, args);
	}

	/**
	 * Lädt Testdaten in die Datenbank beim Start der Anwendung.
	 */
	@Bean
	CommandLineRunner initData(LocationRepository repository) {
		return args -> {
			// Datenbank bereinigen, damit wir keine Duplikate haben
			repository.deleteAll();

			System.out.println("Fülle Datenbank mit Testdaten...");

			// Ravensburg & Umgebung
			repository.save(new Location("McDonald's Ravensburg Zentrum", 47.7819, 9.6133));
			repository.save(new Location("McDonald's Friedrichshafen", 47.6542, 9.4793));
			repository.save(new Location("McDonald's Weingarten", 47.8078, 9.6433));
			
			// Großstädte
			repository.save(new Location("McDonald's Berlin Hbf", 52.5250, 13.3694));
			repository.save(new Location("McDonald's München Stachus", 48.1391, 11.5658));
			repository.save(new Location("McDonald's Hamburg Reeperbahn", 53.5496, 9.9668));
			repository.save(new Location("McDonald's Köln Dom", 50.9413, 6.9583));
			repository.save(new Location("McDonald's Stuttgart Königstraße", 48.7758, 9.1829));
			repository.save(new Location("McDonald's Frankfurt Flughafen", 50.0514, 8.5713));
			repository.save(new Location("McDonald's Leipzig Markt", 51.3400, 12.3740));

			System.out.println("Datenbank initialisiert! Anzahl Einträge: " + repository.count());
		};
	}
}