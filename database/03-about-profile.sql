
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

LOCK TABLES `about_profiles` WRITE;
/*!40000 ALTER TABLE `about_profiles` DISABLE KEYS */;
INSERT INTO `about_profiles` (`id`, `full_name`, `headline`, `bio`, `education`, `location`, `current_focus`, `cv_url`, `profile_image_url`, `created_at`, `updated_at`) VALUES (1,'Marshel Andhino','Computer Engineering Student','Saya mahasiswa Teknik Komputer yang tertarik pada persimpangan antara software, AI, dan perangkat keras. Saya membangun project mulai dari antarmuka dan backend hingga database, deployment, serta integrasi perangkat IoT.\r\n\r\nBagi saya, project bukan hanya tentang membuat sesuatu berjalan, tetapi memahami bagaimana setiap bagian sistem bekerja dan bagaimana membuatnya lebih sederhana, stabil, dan mudah dikembangkan.','Mahasiswa Teknik Komputer','Indonesia','Mendalami backend engineering, local AI, dan IoT—dengan fokus pada bagaimana software, data, dan perangkat dapat bekerja sebagai satu sistem.',NULL,'/static/uploads/about/2f9c40cc7ebf46878f194004ef19af77_Screenshot_2026-04-20_202448.png',NULL,'2026-08-10 07:44:06');
/*!40000 ALTER TABLE `about_profiles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
