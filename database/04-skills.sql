
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` (`id`, `name`, `level`, `icon_url`, `created_at`, `updated_at`, `category`, `detail`, `proficiency`, `years_experience`, `display_order`) VALUES (2,'HTML & CSS','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Frontend','Semantic HTML, responsive layout, and maintainable visual styling.',70,'Portfolio 2026',1),(3,'JavaScript','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Frontend','Interactive browser logic, DOM workflows, and client-side data rendering.',70,'Portfolio 2026',2),(4,'TypeScript','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Frontend','Typed application code for safer component and API integration.',70,'Portfolio 2026',3),(5,'React','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Frontend','Component-driven interfaces and interactive application state.',70,'Portfolio 2026',4),(6,'Next.js','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Frontend','Full-stack React applications, routing, server actions, and production builds.',70,'Portfolio 2026',5),(7,'Tailwind CSS','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Frontend','Utility-first responsive UI implementation and design-system styling.',70,'Portfolio 2026',6),(8,'Python','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Backend','Backend services, automation tools, local AI integration, and testable workflows.',70,'Portfolio 2026',7),(9,'Flask','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Backend','Modular REST APIs with blueprints, authentication, and database services.',70,'Portfolio 2026',8),(10,'FastAPI','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Backend','Typed asynchronous APIs for AI and local service integrations.',70,'Portfolio 2026',9),(11,'REST API','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Backend','Resource-oriented endpoints, validation, authentication, and client integration.',70,'Portfolio 2026',10),(12,'SQLAlchemy','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Data','Relational models, migrations, and service-layer database access.',70,'Portfolio 2026',11),(13,'MySQL','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Data','Relational persistence for users, operations, content, and telemetry.',70,'Portfolio 2026',12),(14,'JWT Auth','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Security','Token-based access control for protected API and admin workflows.',70,'Portfolio 2026',13),(15,'Docker Compose','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Infrastructure','Repeatable multi-service development and deployment environments.',70,'Portfolio 2026',14),(16,'ESP32','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','IoT & Systems','Sensor acquisition and device-to-backend telemetry integration.',70,'Portfolio 2026',15),(17,'WebSocket','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','IoT & Systems','Realtime delivery of device and application state to dashboards.',70,'Portfolio 2026',16),(18,'Ollama','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','AI','Local model runtime for private assistant and translation workflows.',70,'Portfolio 2026',17),(19,'MCP','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Developer Tools','Focused tools that expose safe, low-context capabilities to AI clients.',70,'Portfolio 2026',18),(20,'Chrome Extension','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Developer Tools','Manifest V3 browser extensions with content scripts and local caching.',70,'Portfolio 2026',19),(21,'Git & GitHub','Intermediate',NULL,'2026-08-15 13:42:44','2026-08-15 13:42:44','Developer Tools','Repository workflows, guarded commits, branch checks, and publishing.',70,'Portfolio 2026',20);
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
