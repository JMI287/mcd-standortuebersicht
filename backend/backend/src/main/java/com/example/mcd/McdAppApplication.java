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

    // Dieser Teil hier fehlte wahrscheinlich oder war nicht aktiv:
	@Bean
	CommandLineRunner runner(LocationRepository repository) {
		return args -> {
            // 1. Alte Daten löschen (damit wir keine Doppelten haben)
            repository.deleteAll(); 

            // 2. Neue Testdaten speichern
			repository.save(new Location("McDonald's Berlin Hbf", 52.5250, 13.3694));
			repository.save(new Location("McDonald's München Stachus", 48.1391, 11.5658));
			repository.save(new Location("McDonald's Hamburg Reeperbahn", 53.5496, 9.9668));
            repository.save(new Location("McDonald's Köln Dom", 50.9413, 6.9583));
            
            System.out.println("✅ --- TESTDATEN GELADEN --- ✅");
		};
	}
}
