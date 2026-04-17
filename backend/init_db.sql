-- Base de données pour InfoClub
-- Script d'initialisation pour MySQL

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table member
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `member` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `student_id` VARCHAR(50) UNIQUE,
  `major` VARCHAR(100),
  `year_of_study` INT,
  `phone` VARCHAR(20),
  `role` ENUM('head', 'mod', 'cell') DEFAULT 'cell',
  `status` ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `head_id` INT,
  `hashed_password` VARCHAR(255) NOT NULL,
  CONSTRAINT `fk_member_head` FOREIGN KEY (`head_id`) REFERENCES `member` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table event
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `location` VARCHAR(255),
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME,
  `status` ENUM('upcoming', 'ongoing', 'finished', 'cancelled') DEFAULT 'upcoming',
  `event_type` VARCHAR(100),
  `max_attendees` INT,
  `image_url` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT,
  CONSTRAINT `fk_event_author` FOREIGN KEY (`created_by_id`) REFERENCES `member` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table eventattendance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eventattendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  `status` ENUM('going', 'not_going', 'maybe') DEFAULT 'going',
  `registered_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendance_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table post
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` VARCHAR(255),
  `is_published` TINYINT(1) DEFAULT 0,
  `author_id` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `likes_count` INT DEFAULT 0,
  `comments_count` INT DEFAULT 0,
  `views_count` INT DEFAULT 0,
  CONSTRAINT `fk_post_author` FOREIGN KEY (`author_id`) REFERENCES `member` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table postlike
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `postlike` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `member_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_like_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_like_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_post` (`post_id`, `member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Exemple de données (Optionnel)
-- ------------------------------------------------------------
-- Note: Le mot de passe ici est 'admin123' haché (simulé)
INSERT INTO `member` (`full_name`, `email`, `role`, `status`, `hashed_password`) 
VALUES ('Administrateur InfoClub', 'admin@infoclub.ma', 'head', 'active', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6.5T.aYdM8eNXS');

SET FOREIGN_KEY_CHECKS = 1;
