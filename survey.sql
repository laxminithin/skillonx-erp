-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 18, 2026 at 12:57 PM
-- Server version: 10.3.39-MariaDB
-- PHP Version: 8.4.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `survey`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `label` varchar(32) NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`id`, `college_id`, `label`, `is_current`, `created_at`, `updated_at`) VALUES
(1, 1, '2026–27', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `class_sections`
--

CREATE TABLE `class_sections` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `label` varchar(32) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `class_sections`
--

INSERT INTO `class_sections` (`id`, `college_id`, `department_id`, `label`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'A', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 1, 'B', '2026-08-13 04:53:09', '2026-08-13 04:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `colleges`
--

CREATE TABLE `colleges` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(64) NOT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `address` varchar(512) DEFAULT NULL,
  `logo_url` varchar(512) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `colleges`
--

INSERT INTO `colleges` (`id`, `name`, `code`, `domain`, `created_at`, `updated_at`, `address`, `logo_url`, `is_active`, `timezone`) VALUES
(1, 'Vidya Vikas Institute of Engineering & Technology', 'VVIET', 'vviet.edu.in', '2026-08-13 04:53:09', '2026-08-13 04:53:09', 'Mysuru, Karnataka', NULL, 1, 'Asia/Kolkata'),
(2, 'GSSS Intitute of Engineering and Technology for Women', 'GSSS', NULL, '2026-08-18 13:43:02', '2026-08-18 13:43:02', NULL, NULL, 1, 'Asia/Kolkata');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `college_id`, `department_id`, `code`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'BIS701', 'Big Data Analytics', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 1, 'BCS403', 'Database Management Systems', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, NULL, 'INS', 'Information and Network Security', '2026-08-18 15:08:45', '2026-08-18 15:08:45');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `college_id`, `name`, `code`, `created_at`, `updated_at`) VALUES
(1, 1, 'Information Science & Engineering', 'ISE', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 'Computer Science & Engineering', 'CSE', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, 'Training and Placement Cell', 'TPO', '2026-08-18 06:36:27', '2026-08-18 06:36:27');

-- --------------------------------------------------------

--
-- Table structure for table `faculty_users`
--

CREATE TABLE `faculty_users` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(64) NOT NULL DEFAULT 'FACULTY',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `employee_id` varchar(64) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `designation` varchar(128) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `last_password_change_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `faculty_users`
--

INSERT INTO `faculty_users` (`id`, `college_id`, `department_id`, `name`, `email`, `password_hash`, `role`, `is_active`, `reset_token`, `reset_token_expires_at`, `created_at`, `updated_at`, `employee_id`, `phone`, `designation`, `permissions`, `last_login_at`, `archived_at`, `last_password_change_at`) VALUES
(1, 1, NULL, 'Nithin K', 'admin@skillonx.com', '$2b$10$VrDXpT9Mt1SmU11HfkrowOz84p1BB94/4sSsglAox5EsJxFSNdXDm', 'SUPER_ADMIN', 1, NULL, NULL, '2026-08-13 04:53:09', '2026-08-13 04:53:09', 'SX-001', NULL, 'Platform Administrator', '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', '2026-08-18 13:42:18', NULL, NULL),
(2, 1, NULL, 'College Admin', 'collegeadmin@vviet.edu.in', '$2b$10$VrDXpT9Mt1SmU11HfkrowOz84p1BB94/4sSsglAox5EsJxFSNdXDm', 'COLLEGE_ADMIN', 1, NULL, NULL, '2026-08-13 04:53:09', '2026-08-13 04:53:09', 'VVIET-ADM-01', NULL, 'IQAC / College Admin', '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', NULL, NULL, NULL),
(3, 1, 1, 'Dr. Anita Sharma', 'anita@vviet.edu.in', '$2b$10$VrDXpT9Mt1SmU11HfkrowOz84p1BB94/4sSsglAox5EsJxFSNdXDm', 'FACULTY', 1, NULL, NULL, '2026-08-13 04:53:09', '2026-08-13 04:53:09', 'VVIET-ISE-12', '+91 98765 43210', 'Associate Professor', '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', '2026-08-13 06:43:43', NULL, NULL),
(4, 1, 2, 'Prof. Ravi Kumar', 'ravi@vviet.edu.in', '$2b$10$VrDXpT9Mt1SmU11HfkrowOz84p1BB94/4sSsglAox5EsJxFSNdXDm', 'FACULTY', 1, NULL, NULL, '2026-08-13 04:53:09', '2026-08-13 04:53:09', 'VVIET-CSE-08', NULL, 'Assistant Professor', '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', NULL, NULL, NULL),
(5, 1, 1, 'Rajitha', 'ranjitha@vidyavikas.edu.in', '$2b$10$kOGKtRQldX6diX5wMMjlje9rzYXtbDlgXsEyQ4vWlieWcAqtKkYCa', 'FACULTY', 1, 'd57d16c82db9c896aebcb4d584ae5611dc6f2502fd0e9242', '2026-08-19 16:04:40', '2026-08-13 04:53:58', '2026-08-13 04:53:58', NULL, NULL, 'Assistant Professor', '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', '2026-08-18 06:35:10', NULL, NULL),
(6, 1, 3, 'Madhu BK', 'madhu.bk@vidyavikas.edu.in', '$2b$10$vAM3f8LjW9T3wh9Rk5SPRO0HYtijGk5bZJD/8E5jQm6byNPIURGcC', 'FACULTY', 1, NULL, NULL, '2026-08-18 06:37:18', '2026-08-18 06:37:18', 'VVIET5501', NULL, 'Training and Placement Officer', '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', '2026-08-18 13:39:49', NULL, NULL),
(7, 2, NULL, 'Gireesh SC', 'girish.sc@gsss.edu.in', '$2b$10$cr3x..qXChDlVfZKceooAeT9k/cT/HZN89DGlRa6hJhfKuxpA8qya', 'FACULTY', 1, NULL, NULL, '2026-08-18 13:43:54', '2026-08-18 13:43:54', 'GSSS01', NULL, NULL, '{\"createSurvey\":true,\"publishSurvey\":true,\"viewResponses\":true,\"exportReports\":true,\"manageQuestionBank\":true,\"viewStudentInformation\":true}', '2026-08-18 13:50:31', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations`
--

CREATE TABLE `knex_migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `knex_migrations`
--

INSERT INTO `knex_migrations` (`id`, `name`, `batch`, `migration_time`) VALUES
(1, '20260812100000_init_schema.cjs', 1, '2026-08-13 04:27:41'),
(2, '20260812120000_structure_integrity.cjs', 1, '2026-08-13 04:27:41'),
(3, '20260812200000_admin_platform.cjs', 1, '2026-08-13 04:27:41'),
(4, '20260812210000_college_timezone.cjs', 1, '2026-08-13 04:27:41'),
(5, '20260813000000_password_audit.cjs', 2, '2026-08-18 16:03:14'),
(6, '20260814000000_survey_audit_log.cjs', 2, '2026-08-18 16:03:15'),
(7, '20260815000000_identity_constraints.cjs', 2, '2026-08-18 16:03:15');

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations_lock`
--

CREATE TABLE `knex_migrations_lock` (
  `index` int(10) UNSIGNED NOT NULL,
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `knex_migrations_lock`
--

INSERT INTO `knex_migrations_lock` (`index`, `is_locked`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`id`, `college_id`, `department_id`, `name`, `code`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'B.E. Information Science & Engineering', 'BE-ISE', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 2, 'B.E. Computer Science & Engineering', 'BE-CSE', '2026-08-13 04:53:09', '2026-08-13 04:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(10) UNSIGNED NOT NULL,
  `survey_id` int(10) UNSIGNED NOT NULL,
  `section_id` int(10) UNSIGNED NOT NULL,
  `question_type` varchar(64) NOT NULL,
  `prompt` text NOT NULL,
  `help_text` text DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `allow_comment` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `question_bank_item_id` int(10) UNSIGNED DEFAULT NULL,
  `structure_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `survey_id`, `section_id`, `question_type`, `prompt`, `help_text`, `is_required`, `allow_comment`, `sort_order`, `config`, `question_bank_item_id`, `structure_version`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'LIKERT', 'The faculty explained concepts clearly.', NULL, 1, 0, 0, '{}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 1, 'LIKERT', 'Faculty encourages student participation.', NULL, 1, 0, 1, '{}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, 2, 'LIKERT', 'The objectives of the course were clearly explained.', NULL, 1, 0, 0, '{}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(4, 1, 2, 'LIKERT', 'Course content was clearly presented.', NULL, 1, 0, 1, '{}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(5, 1, 1, 'STAR_RATING', 'Rate the overall teaching quality', NULL, 1, 1, 2, '{\"maxStars\":5}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(6, 1, 2, 'SMILE_RATING', 'How satisfied are you with the course overall?', NULL, 1, 0, 2, '{}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(7, 1, 3, 'LONG_ANSWER', 'Suggestions for improvement', NULL, 0, 0, 0, '{\"maxLength\":1000}', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(8, 2, 4, 'SMILE_RATING', 'How would you rate the overall presentation?', NULL, 1, 0, 0, '{}', NULL, 2, '2026-08-18 06:41:23', '2026-08-18 06:41:23'),
(9, 2, 4, 'STAR_RATING', 'How clearly did the presenters explain overseas education opportunities?', NULL, 1, 0, 1, '{\"maxStars\":5}', NULL, 2, '2026-08-18 06:41:59', '2026-08-18 06:41:59'),
(10, 2, 4, 'SMILE_RATING', 'How useful was the information provided about universities and countries available for higher education?', NULL, 1, 0, 2, '{}', NULL, 2, '2026-08-18 06:42:23', '2026-08-18 06:42:23'),
(11, 2, 4, 'SMILE_RATING', 'How useful was the information regarding admission requirements and application procedures?', NULL, 1, 0, 3, '{}', NULL, 2, '2026-08-18 06:42:41', '2026-08-18 06:42:41'),
(13, 2, 4, 'SMILE_RATING', 'How well were scholarships, financial assistance, and education costs explained?', NULL, 1, 0, 4, '{}', NULL, 3, '2026-08-18 06:43:15', '2026-08-18 06:43:15'),
(14, 2, 4, 'SMILE_RATING', 'How clearly were visa procedures and requirements explained?', NULL, 1, 0, 5, '{}', NULL, 2, '2026-08-18 06:43:35', '2026-08-18 06:43:35'),
(15, 2, 4, 'STAR_RATING', 'How effectively did the presenters address students’ questions and concerns?', NULL, 1, 0, 6, '{\"maxStars\":5}', NULL, 2, '2026-08-18 06:43:56', '2026-08-18 06:43:56'),
(16, 2, 4, 'STAR_RATING', 'How knowledgeable and professional did you find the presenters?', NULL, 1, 0, 7, '{\"maxStars\":5}', NULL, 2, '2026-08-18 06:44:22', '2026-08-18 06:44:22'),
(17, 2, 4, 'LIKERT', 'Would you like the college to organize further guidance or counselling sessions on overseas education?', NULL, 1, 0, 8, '{}', NULL, 2, '2026-08-18 06:44:51', '2026-08-18 06:44:51'),
(18, 2, 4, 'LONG_ANSWER', 'Please share any suggestions, questions, or additional support you would like regarding overseas education.', NULL, 1, 0, 9, '{}', NULL, 5, '2026-08-18 06:45:48', '2026-08-18 06:45:48');

-- --------------------------------------------------------

--
-- Table structure for table `question_bank_items`
--

CREATE TABLE `question_bank_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `question_type` varchar(64) NOT NULL,
  `prompt` text NOT NULL,
  `help_text` text DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `category` varchar(64) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `question_bank_items`
--

INSERT INTO `question_bank_items` (`id`, `college_id`, `created_by`, `question_type`, `prompt`, `help_text`, `config`, `options`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'LIKERT', 'Faculty communicates concepts clearly.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'FACULTY_FEEDBACK', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 3, 'LIKERT', 'Faculty completes syllabus on time.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'FACULTY_FEEDBACK', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, 3, 'LIKERT', 'Faculty encourages student participation.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'FACULTY_FEEDBACK', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(4, 1, 3, 'LIKERT', 'Faculty provides sufficient examples.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'FACULTY_FEEDBACK', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(5, 1, 3, 'LIKERT', 'Faculty uses appropriate teaching methodologies.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'FACULTY_FEEDBACK', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(6, 1, 3, 'LIKERT', 'Course content was clearly presented.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'COURSE_END', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(7, 1, 3, 'LIKERT', 'The objectives of the course were clearly explained.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'COURSE_END', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(8, 1, 3, 'LIKERT', 'Laboratory sessions were well organized.', NULL, '{}', '[{\"label\":\"Strongly Disagree\",\"value\":1},{\"label\":\"Disagree\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Agree\",\"value\":4},{\"label\":\"Strongly Agree\",\"value\":5}]', 'LABORATORY', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(9, 1, 3, 'STAR_RATING', 'Infrastructure facilities are adequate.', NULL, '{\"maxStars\":5}', '[{\"label\":\"Very Poor\",\"value\":1},{\"label\":\"Poor\",\"value\":2},{\"label\":\"Average\",\"value\":3},{\"label\":\"Good\",\"value\":4},{\"label\":\"Excellent\",\"value\":5}]', 'INFRASTRUCTURE', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(10, 1, 3, 'SMILE_RATING', 'Overall satisfaction with laboratory experience', NULL, '{}', '[{\"label\":\"Very Dissatisfied\",\"value\":1},{\"label\":\"Dissatisfied\",\"value\":2},{\"label\":\"Neutral\",\"value\":3},{\"label\":\"Satisfied\",\"value\":4},{\"label\":\"Very Satisfied\",\"value\":5}]', 'LABORATORY', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(11, 1, 3, 'LONG_ANSWER', 'Suggestions for improvement', NULL, '{}', NULL, 'GENERAL', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `question_bank_tags`
--

CREATE TABLE `question_bank_tags` (
  `id` int(10) UNSIGNED NOT NULL,
  `question_bank_item_id` int(10) UNSIGNED NOT NULL,
  `tag` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `question_bank_tags`
--

INSERT INTO `question_bank_tags` (`id`, `question_bank_item_id`, `tag`) VALUES
(2, 1, 'Faculty'),
(1, 1, 'Teaching'),
(4, 2, 'Faculty'),
(3, 2, 'Teaching'),
(6, 3, 'Faculty'),
(5, 3, 'Teaching'),
(8, 4, 'Faculty'),
(7, 4, 'Teaching'),
(10, 5, 'Faculty'),
(9, 5, 'Teaching'),
(11, 6, 'Course'),
(12, 6, 'Teaching'),
(13, 7, 'Course'),
(14, 8, 'Lab'),
(15, 9, 'Infrastructure'),
(16, 10, 'Laboratory'),
(17, 10, 'Student Satisfaction'),
(18, 11, 'Course');

-- --------------------------------------------------------

--
-- Table structure for table `question_options`
--

CREATE TABLE `question_options` (
  `id` int(10) UNSIGNED NOT NULL,
  `question_id` int(10) UNSIGNED NOT NULL,
  `label` varchar(255) NOT NULL,
  `value` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `question_options`
--

INSERT INTO `question_options` (`id`, `question_id`, `label`, `value`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'Strongly Disagree', 1, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 'Disagree', 2, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, 'Neutral', 3, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(4, 1, 'Agree', 4, 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(5, 1, 'Strongly Agree', 5, 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(6, 2, 'Strongly Disagree', 1, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(7, 2, 'Disagree', 2, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(8, 2, 'Neutral', 3, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(9, 2, 'Agree', 4, 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(10, 2, 'Strongly Agree', 5, 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(11, 3, 'Strongly Disagree', 1, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(12, 3, 'Disagree', 2, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(13, 3, 'Neutral', 3, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(14, 3, 'Agree', 4, 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(15, 3, 'Strongly Agree', 5, 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(16, 4, 'Strongly Disagree', 1, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(17, 4, 'Disagree', 2, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(18, 4, 'Neutral', 3, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(19, 4, 'Agree', 4, 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(20, 4, 'Strongly Agree', 5, 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(21, 5, 'Very Poor', 1, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(22, 5, 'Poor', 2, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(23, 5, 'Average', 3, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(24, 5, 'Good', 4, 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(25, 5, 'Excellent', 5, 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(26, 6, 'Very Dissatisfied', 1, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(27, 6, 'Dissatisfied', 2, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(28, 6, 'Neutral', 3, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(29, 6, 'Satisfied', 4, 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(30, 6, 'Very Satisfied', 5, 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(36, 8, 'Very Dissatisfied', 1, 0, '2026-08-18 06:41:39', '2026-08-18 06:41:39'),
(37, 8, 'Dissatisfied', 2, 1, '2026-08-18 06:41:39', '2026-08-18 06:41:39'),
(38, 8, 'Neutral', 3, 2, '2026-08-18 06:41:39', '2026-08-18 06:41:39'),
(39, 8, 'Satisfied', 4, 3, '2026-08-18 06:41:39', '2026-08-18 06:41:39'),
(40, 8, 'Very Satisfied', 5, 4, '2026-08-18 06:41:39', '2026-08-18 06:41:39'),
(46, 9, 'Very Poor', 1, 0, '2026-08-18 06:42:06', '2026-08-18 06:42:06'),
(47, 9, 'Poor', 2, 1, '2026-08-18 06:42:06', '2026-08-18 06:42:06'),
(48, 9, 'Average', 3, 2, '2026-08-18 06:42:06', '2026-08-18 06:42:06'),
(49, 9, 'Good', 4, 3, '2026-08-18 06:42:06', '2026-08-18 06:42:06'),
(50, 9, 'Excellent', 5, 4, '2026-08-18 06:42:06', '2026-08-18 06:42:06'),
(56, 10, 'Very Dissatisfied', 1, 0, '2026-08-18 06:42:28', '2026-08-18 06:42:28'),
(57, 10, 'Dissatisfied', 2, 1, '2026-08-18 06:42:28', '2026-08-18 06:42:28'),
(58, 10, 'Neutral', 3, 2, '2026-08-18 06:42:28', '2026-08-18 06:42:28'),
(59, 10, 'Satisfied', 4, 3, '2026-08-18 06:42:28', '2026-08-18 06:42:28'),
(60, 10, 'Very Satisfied', 5, 4, '2026-08-18 06:42:28', '2026-08-18 06:42:28'),
(66, 11, 'Very Dissatisfied', 1, 0, '2026-08-18 06:42:49', '2026-08-18 06:42:49'),
(67, 11, 'Dissatisfied', 2, 1, '2026-08-18 06:42:49', '2026-08-18 06:42:49'),
(68, 11, 'Neutral', 3, 2, '2026-08-18 06:42:49', '2026-08-18 06:42:49'),
(69, 11, 'Satisfied', 4, 3, '2026-08-18 06:42:49', '2026-08-18 06:42:49'),
(70, 11, 'Very Satisfied', 5, 4, '2026-08-18 06:42:49', '2026-08-18 06:42:49'),
(86, 13, 'Very Dissatisfied', 1, 0, '2026-08-18 06:43:29', '2026-08-18 06:43:29'),
(87, 13, 'Dissatisfied', 2, 1, '2026-08-18 06:43:29', '2026-08-18 06:43:29'),
(88, 13, 'Neutral', 3, 2, '2026-08-18 06:43:29', '2026-08-18 06:43:29'),
(89, 13, 'Satisfied', 4, 3, '2026-08-18 06:43:29', '2026-08-18 06:43:29'),
(90, 13, 'Very Satisfied', 5, 4, '2026-08-18 06:43:29', '2026-08-18 06:43:29'),
(96, 14, 'Very Dissatisfied', 1, 0, '2026-08-18 06:43:39', '2026-08-18 06:43:39'),
(97, 14, 'Dissatisfied', 2, 1, '2026-08-18 06:43:39', '2026-08-18 06:43:39'),
(98, 14, 'Neutral', 3, 2, '2026-08-18 06:43:39', '2026-08-18 06:43:39'),
(99, 14, 'Satisfied', 4, 3, '2026-08-18 06:43:39', '2026-08-18 06:43:39'),
(100, 14, 'Very Satisfied', 5, 4, '2026-08-18 06:43:39', '2026-08-18 06:43:39'),
(106, 15, 'Very Poor', 1, 0, '2026-08-18 06:44:01', '2026-08-18 06:44:01'),
(107, 15, 'Poor', 2, 1, '2026-08-18 06:44:01', '2026-08-18 06:44:01'),
(108, 15, 'Average', 3, 2, '2026-08-18 06:44:01', '2026-08-18 06:44:01'),
(109, 15, 'Good', 4, 3, '2026-08-18 06:44:01', '2026-08-18 06:44:01'),
(110, 15, 'Excellent', 5, 4, '2026-08-18 06:44:01', '2026-08-18 06:44:01'),
(116, 16, 'Very Poor', 1, 0, '2026-08-18 06:44:27', '2026-08-18 06:44:27'),
(117, 16, 'Poor', 2, 1, '2026-08-18 06:44:27', '2026-08-18 06:44:27'),
(118, 16, 'Average', 3, 2, '2026-08-18 06:44:27', '2026-08-18 06:44:27'),
(119, 16, 'Good', 4, 3, '2026-08-18 06:44:27', '2026-08-18 06:44:27'),
(120, 16, 'Excellent', 5, 4, '2026-08-18 06:44:27', '2026-08-18 06:44:27'),
(126, 17, 'Strongly Disagree', 1, 0, '2026-08-18 06:44:58', '2026-08-18 06:44:58'),
(127, 17, 'Disagree', 2, 1, '2026-08-18 06:44:58', '2026-08-18 06:44:58'),
(128, 17, 'Neutral', 3, 2, '2026-08-18 06:44:58', '2026-08-18 06:44:58'),
(129, 17, 'Agree', 4, 3, '2026-08-18 06:44:58', '2026-08-18 06:44:58'),
(130, 17, 'Strongly Agree', 5, 4, '2026-08-18 06:44:58', '2026-08-18 06:44:58');

-- --------------------------------------------------------

--
-- Table structure for table `semesters`
--

CREATE TABLE `semesters` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `label` varchar(32) NOT NULL,
  `number` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `semesters`
--

INSERT INTO `semesters` (`id`, `college_id`, `label`, `number`, `created_at`, `updated_at`) VALUES
(1, 1, 'I', 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 'II', 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, 'III', 3, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(4, 1, 'IV', 4, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(5, 1, 'V', 5, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(6, 1, 'VI', 6, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(7, 1, 'VII', 7, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(8, 1, 'VIII', 8, '2026-08-13 04:53:09', '2026-08-13 04:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `usn` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `semester` varchar(32) DEFAULT NULL,
  `section` varchar(32) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `college_id`, `department_id`, `name`, `usn`, `email`, `semester`, `section`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'ADITHYA R ATHREYA', '4VM23IS002', 'adithyaathreya2005@gmail.com', NULL, NULL, '2026-08-13 06:45:26', '2026-08-18 06:56:19'),
(2, 1, 3, 'Sandesh M', '4VM24IS414', 'msandesh673@gmail.com', NULL, NULL, '2026-08-13 06:45:57', '2026-08-18 06:58:08'),
(3, 1, 3, 'Madhu BK', '4VV24IS024', 'madhu.bk@vidyavikas.edu.in', NULL, NULL, '2026-08-18 06:53:36', '2026-08-18 06:53:36'),
(4, 1, 3, 'Poojitha A', '4VM23IS040', 'poojithaanand1003@gmail.com', NULL, NULL, '2026-08-18 06:55:35', '2026-08-18 06:55:35'),
(5, 1, 3, 'Madesha KL', '4VM23IS025', 'mmadu4678@gmail.com', NULL, NULL, '2026-08-18 06:55:44', '2026-08-18 06:55:44'),
(6, 1, 3, 'Hemadri S', '4VM23IS017', 'hemadri.sathish2119@gmail.com', NULL, NULL, '2026-08-18 06:55:44', '2026-08-18 06:55:44'),
(7, 1, 3, 'PUNITH T R', '4VM24IS411', 'punithraras@gmail.com', NULL, NULL, '2026-08-18 06:55:48', '2026-08-18 06:55:48'),
(8, 1, 3, 'Pooja', '4VM23IS038', 'poojamahesh808@gmail.com', NULL, NULL, '2026-08-18 06:55:50', '2026-08-18 06:55:50'),
(9, 1, 3, 'Kanchana T', '4VM23IS019', 'kanchana262005@gmail.com', NULL, NULL, '2026-08-18 06:56:06', '2026-08-18 06:56:06'),
(10, 1, 3, 'Darshini PN', '4VM23IS011', 'darshininachappa@gmail.com', NULL, NULL, '2026-08-18 06:56:10', '2026-08-18 06:56:10'),
(11, 1, 3, 'P P Saniya Dechamma', '4VM23IS036', 'saniyadechamma@gmail.com', NULL, NULL, '2026-08-18 06:56:21', '2026-08-18 06:56:21'),
(12, 1, 3, 'Mehek Noorain', '4VM23IS030', 'meheknoorain@gmail.com', NULL, NULL, '2026-08-18 06:56:22', '2026-08-18 06:56:22'),
(13, 1, 3, 'Anjana A L', '4VM23IS005', 'anjanagowda2005@gmail.com', NULL, NULL, '2026-08-18 06:56:22', '2026-08-18 06:56:22'),
(14, 1, 3, 'Lekhana S N', '4VM23IS023', 'lekhanasn7@gmail.com', NULL, NULL, '2026-08-18 06:56:25', '2026-08-18 06:56:25'),
(15, 1, 3, 'Nithin R', '4VM23IS035', 'nraj132004@gmail.com', NULL, NULL, '2026-08-18 06:56:34', '2026-08-18 06:56:34'),
(16, 1, 3, 'Deekshith Nayak', '4VM23IS012', 'dnayaka8217@gmail.com', NULL, NULL, '2026-08-18 06:57:14', '2026-08-18 06:57:14'),
(17, 1, 3, 'Sudeep', '4VM24IS415', 'sudeepgowda7019@gmail.com', NULL, NULL, '2026-08-18 06:57:15', '2026-08-18 06:57:15'),
(18, 1, 3, 'Bhavesh Ramu KJ', '4VM23IS008', 'bhaveshramukj@gmail.com', NULL, NULL, '2026-08-18 06:57:37', '2026-08-18 06:57:37'),
(19, 1, 3, 'Nisarga K S', '4VM23IS033', 'nisargamanjula0220@gmail.com', NULL, NULL, '2026-08-18 06:57:40', '2026-08-18 06:57:40'),
(20, 1, 3, 'G Devareddy Gouda', '4VM23IS014', 'devareddygouda45@gmail.com', NULL, NULL, '2026-08-18 06:57:59', '2026-08-18 06:57:59'),
(21, 1, 3, 'Bhanupriya', '4VM23IS007', 'bhanupriya2075@gmail.com', NULL, NULL, '2026-08-18 06:58:03', '2026-08-18 06:58:03'),
(22, 1, 3, 'Manoj V', '4VM24IS406', 'manumanoj9766@gmail.com', NULL, NULL, '2026-08-18 06:58:10', '2026-08-18 06:58:10'),
(23, 1, 3, 'Danish Amed', '4VM24IS401', '108cs21010@gmail.com', NULL, NULL, '2026-08-18 06:58:13', '2026-08-18 06:58:13'),
(24, 1, 3, 'Keerthana K G', '4VM23IS022', 'kgkeerthana693@gmail.com', NULL, NULL, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(25, 1, 3, 'Manjunath S', '4VM23IS028', 'jpmanjunath2307@gmail.com', NULL, NULL, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(26, 1, 3, 'Bhanuprakash SC', '4VM23IS006', 'bhanuprakashc1502@gmail.com', NULL, NULL, '2026-08-18 06:58:37', '2026-08-18 06:58:37'),
(27, 1, 3, 'Vikas P', '4VM24IS416', 'vikasvikki488@gmail.com', NULL, NULL, '2026-08-18 06:58:45', '2026-08-18 06:58:45'),
(28, 1, 3, 'Poojitha G', '4VM23IS041', 'poojithashaiva1702@gmail.com', NULL, NULL, '2026-08-18 06:58:51', '2026-08-18 06:58:51'),
(29, 1, 3, 'Sagar K S', '4VM24IS413', 'sagarkssagar8660@gamil.com', NULL, NULL, '2026-08-18 06:58:54', '2026-08-18 06:58:54'),
(30, 1, 3, 'Punyashree GS', '4VM23IS042', 'ppunyashree649@gmail.com', NULL, NULL, '2026-08-18 06:59:21', '2026-08-18 06:59:21'),
(31, 1, 3, 'Vidya H', '4VM23IS051', 'vidyahareesh28@gmail.com', NULL, NULL, '2026-08-18 06:59:24', '2026-08-18 06:59:24'),
(32, 1, 3, 'Shalini M L', '4VM23IS046', 'shalinilavagowda@gmail.com', NULL, NULL, '2026-08-18 06:59:26', '2026-08-18 06:59:26'),
(33, 1, 3, 'Aishwarya N', '4VM23IS003', 'aishunatesh411@gmail.com', NULL, NULL, '2026-08-18 06:59:31', '2026-08-18 06:59:31'),
(34, 1, 3, 'Sahana', '4VM23IS045', 'firangisahana@gmail.com', NULL, NULL, '2026-08-18 06:59:59', '2026-08-18 06:59:59'),
(35, 1, 3, 'Karthik Herundi', '4VM23IS020', 'karthikhp000@gmail.com', NULL, NULL, '2026-08-18 07:10:00', '2026-08-18 07:10:00'),
(36, 1, 3, 'Nithesh Kumar SR', '4VM23IS034', 'nknithesh01@gmail.com', NULL, NULL, '2026-08-18 10:34:33', '2026-08-18 10:34:33'),
(37, 1, 3, 'Varu Deekshith', '4VM23IS050', 'varudeekshith077@gmail.com', NULL, NULL, '2026-08-18 11:19:04', '2026-08-18 11:19:04'),
(38, 1, 3, 'Girish S C', '4NI20PCS01', 'girish.sc@gsss.edu', NULL, NULL, '2026-08-18 13:53:05', '2026-08-18 13:53:05');

-- --------------------------------------------------------

--
-- Table structure for table `surveys`
--

CREATE TABLE `surveys` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `survey_type` varchar(64) NOT NULL DEFAULT 'CUSTOM',
  `academic_year_id` int(10) UNSIGNED DEFAULT NULL,
  `semester_id` int(10) UNSIGNED DEFAULT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `subject_faculty_id` int(10) UNSIGNED DEFAULT NULL,
  `class_section_id` int(10) UNSIGNED DEFAULT NULL,
  `start_at` timestamp NULL DEFAULT NULL,
  `end_at` timestamp NULL DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'DRAFT',
  `response_policy` varchar(32) NOT NULL DEFAULT 'ONE_PER_STUDENT',
  `identity_mode` varchar(32) NOT NULL DEFAULT 'IDENTIFIED',
  `duplicated_from_id` int(10) UNSIGNED DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `structure_locked` tinyint(1) NOT NULL DEFAULT 0,
  `structure_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `published_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `surveys`
--

INSERT INTO `surveys` (`id`, `college_id`, `created_by`, `title`, `description`, `survey_type`, `academic_year_id`, `semester_id`, `department_id`, `course_id`, `subject_faculty_id`, `class_section_id`, `start_at`, `end_at`, `status`, `response_policy`, `identity_mode`, `duplicated_from_id`, `published_at`, `closed_at`, `archived_at`, `deleted_at`, `structure_locked`, `structure_version`, `published_snapshot`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'Course End Survey — Big Data Analytics', 'End-of-course feedback for BIS701 Big Data Analytics.', 'COURSE_END', 1, 7, 1, 1, 3, 1, '2026-08-13 04:53:09', '2026-09-12 04:53:09', 'ACTIVE', 'ONE_PER_STUDENT', 'ANONYMOUS', NULL, '2026-08-13 06:44:24', NULL, NULL, NULL, 1, 1, '{\"capturedAt\":\"2026-08-13T06:44:24.247Z\",\"structureVersion\":1,\"title\":\"Course End Survey — Big Data Analytics\",\"sections\":[{\"id\":1,\"title\":\"Teaching & Learning\",\"description\":null,\"sortOrder\":0,\"questions\":[{\"id\":1,\"sectionId\":1,\"questionType\":\"LIKERT\",\"prompt\":\"The faculty explained concepts clearly.\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":0,\"structureVersion\":1,\"config\":{},\"options\":[{\"id\":1,\"label\":\"Strongly Disagree\",\"value\":1,\"sortOrder\":0},{\"id\":2,\"label\":\"Disagree\",\"value\":2,\"sortOrder\":1},{\"id\":3,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":4,\"label\":\"Agree\",\"value\":4,\"sortOrder\":3},{\"id\":5,\"label\":\"Strongly Agree\",\"value\":5,\"sortOrder\":4}]},{\"id\":2,\"sectionId\":1,\"questionType\":\"LIKERT\",\"prompt\":\"Faculty encourages student participation.\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":1,\"structureVersion\":1,\"config\":{},\"options\":[{\"id\":6,\"label\":\"Strongly Disagree\",\"value\":1,\"sortOrder\":0},{\"id\":7,\"label\":\"Disagree\",\"value\":2,\"sortOrder\":1},{\"id\":8,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":9,\"label\":\"Agree\",\"value\":4,\"sortOrder\":3},{\"id\":10,\"label\":\"Strongly Agree\",\"value\":5,\"sortOrder\":4}]},{\"id\":5,\"sectionId\":1,\"questionType\":\"STAR_RATING\",\"prompt\":\"Rate the overall teaching quality\",\"helpText\":null,\"isRequired\":true,\"allowComment\":true,\"sortOrder\":2,\"structureVersion\":1,\"config\":{\"maxStars\":5},\"options\":[{\"id\":21,\"label\":\"Very Poor\",\"value\":1,\"sortOrder\":0},{\"id\":22,\"label\":\"Poor\",\"value\":2,\"sortOrder\":1},{\"id\":23,\"label\":\"Average\",\"value\":3,\"sortOrder\":2},{\"id\":24,\"label\":\"Good\",\"value\":4,\"sortOrder\":3},{\"id\":25,\"label\":\"Excellent\",\"value\":5,\"sortOrder\":4}]}]},{\"id\":2,\"title\":\"Course Content\",\"description\":null,\"sortOrder\":1,\"questions\":[{\"id\":3,\"sectionId\":2,\"questionType\":\"LIKERT\",\"prompt\":\"The objectives of the course were clearly explained.\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":0,\"structureVersion\":1,\"config\":{},\"options\":[{\"id\":11,\"label\":\"Strongly Disagree\",\"value\":1,\"sortOrder\":0},{\"id\":12,\"label\":\"Disagree\",\"value\":2,\"sortOrder\":1},{\"id\":13,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":14,\"label\":\"Agree\",\"value\":4,\"sortOrder\":3},{\"id\":15,\"label\":\"Strongly Agree\",\"value\":5,\"sortOrder\":4}]},{\"id\":4,\"sectionId\":2,\"questionType\":\"LIKERT\",\"prompt\":\"Course content was clearly presented.\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":1,\"structureVersion\":1,\"config\":{},\"options\":[{\"id\":16,\"label\":\"Strongly Disagree\",\"value\":1,\"sortOrder\":0},{\"id\":17,\"label\":\"Disagree\",\"value\":2,\"sortOrder\":1},{\"id\":18,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":19,\"label\":\"Agree\",\"value\":4,\"sortOrder\":3},{\"id\":20,\"label\":\"Strongly Agree\",\"value\":5,\"sortOrder\":4}]},{\"id\":6,\"sectionId\":2,\"questionType\":\"SMILE_RATING\",\"prompt\":\"How satisfied are you with the course overall?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":2,\"structureVersion\":1,\"config\":{},\"options\":[{\"id\":26,\"label\":\"Very Dissatisfied\",\"value\":1,\"sortOrder\":0},{\"id\":27,\"label\":\"Dissatisfied\",\"value\":2,\"sortOrder\":1},{\"id\":28,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":29,\"label\":\"Satisfied\",\"value\":4,\"sortOrder\":3},{\"id\":30,\"label\":\"Very Satisfied\",\"value\":5,\"sortOrder\":4}]}]},{\"id\":3,\"title\":\"Suggestions\",\"description\":null,\"sortOrder\":2,\"questions\":[{\"id\":7,\"sectionId\":3,\"questionType\":\"LONG_ANSWER\",\"prompt\":\"Suggestions for improvement\",\"helpText\":null,\"isRequired\":false,\"allowComment\":false,\"sortOrder\":0,\"structureVersion\":1,\"config\":{\"maxLength\":1000},\"options\":[]}]}]}', '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 6, 'Over Seas Study Presentation', 'This is a survey to understand how much it helped the students. ', 'PLACEMENT_TRAINING', 1, 7, 3, NULL, 6, NULL, '2026-08-18 16:09:00', '2026-08-19 16:10:00', 'ACTIVE', 'ONE_PER_STUDENT', 'IDENTIFIED', NULL, '2026-08-18 16:16:11', NULL, NULL, NULL, 1, 1, '{\"capturedAt\":\"2026-08-18T06:46:11.601Z\",\"structureVersion\":1,\"title\":\"Over Seas Study Presentation\",\"sections\":[{\"id\":4,\"title\":\"Section 1\",\"description\":\"General feedback\",\"sortOrder\":0,\"questions\":[{\"id\":8,\"sectionId\":4,\"questionType\":\"SMILE_RATING\",\"prompt\":\"How would you rate the overall presentation?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":0,\"structureVersion\":2,\"config\":{},\"options\":[{\"id\":36,\"label\":\"Very Dissatisfied\",\"value\":1,\"sortOrder\":0},{\"id\":37,\"label\":\"Dissatisfied\",\"value\":2,\"sortOrder\":1},{\"id\":38,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":39,\"label\":\"Satisfied\",\"value\":4,\"sortOrder\":3},{\"id\":40,\"label\":\"Very Satisfied\",\"value\":5,\"sortOrder\":4}]},{\"id\":9,\"sectionId\":4,\"questionType\":\"STAR_RATING\",\"prompt\":\"How clearly did the presenters explain overseas education opportunities?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":1,\"structureVersion\":2,\"config\":{\"maxStars\":5},\"options\":[{\"id\":46,\"label\":\"Very Poor\",\"value\":1,\"sortOrder\":0},{\"id\":47,\"label\":\"Poor\",\"value\":2,\"sortOrder\":1},{\"id\":48,\"label\":\"Average\",\"value\":3,\"sortOrder\":2},{\"id\":49,\"label\":\"Good\",\"value\":4,\"sortOrder\":3},{\"id\":50,\"label\":\"Excellent\",\"value\":5,\"sortOrder\":4}]},{\"id\":10,\"sectionId\":4,\"questionType\":\"SMILE_RATING\",\"prompt\":\"How useful was the information provided about universities and countries available for higher education?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":2,\"structureVersion\":2,\"config\":{},\"options\":[{\"id\":56,\"label\":\"Very Dissatisfied\",\"value\":1,\"sortOrder\":0},{\"id\":57,\"label\":\"Dissatisfied\",\"value\":2,\"sortOrder\":1},{\"id\":58,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":59,\"label\":\"Satisfied\",\"value\":4,\"sortOrder\":3},{\"id\":60,\"label\":\"Very Satisfied\",\"value\":5,\"sortOrder\":4}]},{\"id\":11,\"sectionId\":4,\"questionType\":\"SMILE_RATING\",\"prompt\":\"How useful was the information regarding admission requirements and application procedures?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":3,\"structureVersion\":2,\"config\":{},\"options\":[{\"id\":66,\"label\":\"Very Dissatisfied\",\"value\":1,\"sortOrder\":0},{\"id\":67,\"label\":\"Dissatisfied\",\"value\":2,\"sortOrder\":1},{\"id\":68,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":69,\"label\":\"Satisfied\",\"value\":4,\"sortOrder\":3},{\"id\":70,\"label\":\"Very Satisfied\",\"value\":5,\"sortOrder\":4}]},{\"id\":13,\"sectionId\":4,\"questionType\":\"SMILE_RATING\",\"prompt\":\"How well were scholarships, financial assistance, and education costs explained?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":4,\"structureVersion\":3,\"config\":{},\"options\":[{\"id\":86,\"label\":\"Very Dissatisfied\",\"value\":1,\"sortOrder\":0},{\"id\":87,\"label\":\"Dissatisfied\",\"value\":2,\"sortOrder\":1},{\"id\":88,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":89,\"label\":\"Satisfied\",\"value\":4,\"sortOrder\":3},{\"id\":90,\"label\":\"Very Satisfied\",\"value\":5,\"sortOrder\":4}]},{\"id\":14,\"sectionId\":4,\"questionType\":\"SMILE_RATING\",\"prompt\":\"How clearly were visa procedures and requirements explained?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":5,\"structureVersion\":2,\"config\":{},\"options\":[{\"id\":96,\"label\":\"Very Dissatisfied\",\"value\":1,\"sortOrder\":0},{\"id\":97,\"label\":\"Dissatisfied\",\"value\":2,\"sortOrder\":1},{\"id\":98,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":99,\"label\":\"Satisfied\",\"value\":4,\"sortOrder\":3},{\"id\":100,\"label\":\"Very Satisfied\",\"value\":5,\"sortOrder\":4}]},{\"id\":15,\"sectionId\":4,\"questionType\":\"STAR_RATING\",\"prompt\":\"How effectively did the presenters address students’ questions and concerns?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":6,\"structureVersion\":2,\"config\":{\"maxStars\":5},\"options\":[{\"id\":106,\"label\":\"Very Poor\",\"value\":1,\"sortOrder\":0},{\"id\":107,\"label\":\"Poor\",\"value\":2,\"sortOrder\":1},{\"id\":108,\"label\":\"Average\",\"value\":3,\"sortOrder\":2},{\"id\":109,\"label\":\"Good\",\"value\":4,\"sortOrder\":3},{\"id\":110,\"label\":\"Excellent\",\"value\":5,\"sortOrder\":4}]},{\"id\":16,\"sectionId\":4,\"questionType\":\"STAR_RATING\",\"prompt\":\"How knowledgeable and professional did you find the presenters?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":7,\"structureVersion\":2,\"config\":{\"maxStars\":5},\"options\":[{\"id\":116,\"label\":\"Very Poor\",\"value\":1,\"sortOrder\":0},{\"id\":117,\"label\":\"Poor\",\"value\":2,\"sortOrder\":1},{\"id\":118,\"label\":\"Average\",\"value\":3,\"sortOrder\":2},{\"id\":119,\"label\":\"Good\",\"value\":4,\"sortOrder\":3},{\"id\":120,\"label\":\"Excellent\",\"value\":5,\"sortOrder\":4}]},{\"id\":17,\"sectionId\":4,\"questionType\":\"LIKERT\",\"prompt\":\"Would you like the college to organize further guidance or counselling sessions on overseas education?\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":8,\"structureVersion\":2,\"config\":{},\"options\":[{\"id\":126,\"label\":\"Strongly Disagree\",\"value\":1,\"sortOrder\":0},{\"id\":127,\"label\":\"Disagree\",\"value\":2,\"sortOrder\":1},{\"id\":128,\"label\":\"Neutral\",\"value\":3,\"sortOrder\":2},{\"id\":129,\"label\":\"Agree\",\"value\":4,\"sortOrder\":3},{\"id\":130,\"label\":\"Strongly Agree\",\"value\":5,\"sortOrder\":4}]},{\"id\":18,\"sectionId\":4,\"questionType\":\"LONG_ANSWER\",\"prompt\":\"Please share any suggestions, questions, or additional support you would like regarding overseas education.\",\"helpText\":null,\"isRequired\":true,\"allowComment\":false,\"sortOrder\":9,\"structureVersion\":5,\"config\":{},\"options\":[]}]}]}', '2026-08-18 06:40:10', '2026-08-18 06:40:10');

-- --------------------------------------------------------

--
-- Table structure for table `survey_answers`
--

CREATE TABLE `survey_answers` (
  `id` int(10) UNSIGNED NOT NULL,
  `submission_id` int(10) UNSIGNED NOT NULL,
  `question_id` int(10) UNSIGNED NOT NULL,
  `text_answer` text DEFAULT NULL,
  `numeric_answer` decimal(10,2) DEFAULT NULL,
  `selected_option_id` int(10) UNSIGNED DEFAULT NULL,
  `json_answer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `question_structure_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `survey_answers`
--

INSERT INTO `survey_answers` (`id`, `submission_id`, `question_id`, `text_answer`, `numeric_answer`, `selected_option_id`, `json_answer`, `comment`, `question_structure_version`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, 5.00, 5, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(2, 1, 2, NULL, 5.00, 10, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(3, 1, 3, NULL, 5.00, 15, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(4, 1, 4, NULL, 5.00, 20, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(5, 1, 5, NULL, 4.00, 24, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(6, 1, 6, NULL, 4.00, 29, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(7, 1, 7, 'No suggestion ', NULL, NULL, NULL, NULL, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14'),
(8, 2, 1, NULL, 5.00, 5, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(9, 2, 2, NULL, 5.00, 10, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(10, 2, 3, NULL, 5.00, 15, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(11, 2, 4, NULL, 5.00, 20, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(12, 2, 5, NULL, 4.00, 24, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(13, 2, 6, NULL, 4.00, 29, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(14, 2, 7, 'No suggestion ', NULL, NULL, NULL, NULL, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11'),
(15, 3, 8, NULL, 3.00, 38, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(16, 3, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(17, 3, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(18, 3, 11, NULL, 3.00, 68, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(19, 3, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(20, 3, 14, NULL, 2.00, 97, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(21, 3, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(22, 3, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(23, 3, 17, NULL, 3.00, 128, NULL, NULL, 2, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(24, 3, 18, 'This is test', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:54:04', '2026-08-18 06:54:04'),
(25, 4, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(26, 4, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(27, 4, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(28, 4, 11, NULL, 5.00, 70, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(29, 4, 13, NULL, 5.00, 90, NULL, NULL, 3, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(30, 4, 14, NULL, 5.00, 100, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(31, 4, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(32, 4, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(33, 4, 17, NULL, 5.00, 130, NULL, NULL, 2, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(34, 4, 18, 'Nothing ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:56:11', '2026-08-18 06:56:11'),
(35, 11, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(36, 11, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(37, 11, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(38, 11, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(39, 11, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(40, 11, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(41, 11, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(42, 11, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(43, 11, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(44, 11, 18, 'The presentation was really good, no suggestion ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:57:16', '2026-08-18 06:57:16'),
(45, 5, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(46, 5, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(47, 5, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(48, 5, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(49, 5, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(50, 5, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(51, 5, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(52, 5, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(53, 5, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(54, 5, 18, 'Good ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:57:24', '2026-08-18 06:57:24'),
(55, 17, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(56, 17, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(57, 17, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(58, 17, 11, NULL, 5.00, 70, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(59, 17, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(60, 17, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(61, 17, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(62, 17, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(63, 17, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(64, 17, 18, 'Null', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:57:36', '2026-08-18 06:57:36'),
(65, 6, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(66, 6, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(67, 6, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(68, 6, 11, NULL, 5.00, 70, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(69, 6, 13, NULL, 5.00, 90, NULL, NULL, 3, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(70, 6, 14, NULL, 5.00, 100, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(71, 6, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(72, 6, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(73, 6, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(74, 6, 18, '-------', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:57:58', '2026-08-18 06:57:58'),
(75, 19, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(76, 19, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(77, 19, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(78, 19, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(79, 19, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(80, 19, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(81, 19, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(82, 19, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(83, 19, 17, NULL, 5.00, 130, NULL, NULL, 2, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(84, 19, 18, 'Good', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:58:00', '2026-08-18 06:58:00'),
(85, 13, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(86, 13, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(87, 13, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(88, 13, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(89, 13, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(90, 13, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(91, 13, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(92, 13, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(93, 13, 17, NULL, 2.00, 127, NULL, NULL, 2, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(94, 13, 18, 'N/A', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(95, 16, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(96, 16, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(97, 16, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(98, 16, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(99, 16, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(100, 16, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(101, 16, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(102, 16, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(103, 16, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(104, 16, 18, 'Presentation was really good , no suggestion ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:58:28', '2026-08-18 06:58:28'),
(105, 15, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(106, 15, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(107, 15, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(108, 15, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(109, 15, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(110, 15, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(111, 15, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(112, 15, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(113, 15, 17, NULL, 2.00, 127, NULL, NULL, 2, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(114, 15, 18, 'Nil', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(115, 22, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(116, 22, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(117, 22, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(118, 22, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(119, 22, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(120, 22, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(121, 22, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(122, 22, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(123, 22, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(124, 22, 18, 'Nothing ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:58:33', '2026-08-18 06:58:33'),
(125, 23, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(126, 23, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(127, 23, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(128, 23, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(129, 23, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(130, 23, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(131, 23, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(132, 23, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(133, 23, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(134, 23, 18, 'No', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:58:41', '2026-08-18 06:58:41'),
(135, 26, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(136, 26, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(137, 26, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(138, 26, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(139, 26, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(140, 26, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(141, 26, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(142, 26, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(143, 26, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(144, 26, 18, 'No suggestion ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:59:06', '2026-08-18 06:59:06'),
(145, 24, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(146, 24, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(147, 24, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(148, 24, 11, NULL, 3.00, 68, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(149, 24, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(150, 24, 14, NULL, 3.00, 98, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(151, 24, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(152, 24, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(153, 24, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(154, 24, 18, '... ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:59:18', '2026-08-18 06:59:18'),
(155, 9, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(156, 9, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(157, 9, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(158, 9, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(159, 9, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(160, 9, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(161, 9, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(162, 9, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(163, 9, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(164, 9, 18, 'Provide particular information about the country along with universities ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:59:19', '2026-08-18 06:59:19'),
(165, 10, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(166, 10, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(167, 10, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(168, 10, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(169, 10, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(170, 10, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(171, 10, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(172, 10, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(173, 10, 17, NULL, 5.00, 130, NULL, NULL, 2, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(174, 10, 18, 'Provide particular information about that county along with it’s university ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:59:30', '2026-08-18 06:59:30'),
(175, 18, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(176, 18, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(177, 18, 10, NULL, 3.00, 58, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(178, 18, 11, NULL, 2.00, 67, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(179, 18, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(180, 18, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(181, 18, 15, NULL, 2.00, 107, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(182, 18, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(183, 18, 17, NULL, 3.00, 128, NULL, NULL, 2, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(184, 18, 18, 'Tell more information about country ', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:59:48', '2026-08-18 06:59:48'),
(185, 25, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(186, 25, 9, NULL, 3.00, 48, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(187, 25, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(188, 25, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(189, 25, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(190, 25, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(191, 25, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(192, 25, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(193, 25, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(194, 25, 18, 'No', NULL, NULL, NULL, NULL, 5, '2026-08-18 06:59:51', '2026-08-18 06:59:51'),
(195, 28, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(196, 28, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(197, 28, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(198, 28, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(199, 28, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(200, 28, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(201, 28, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(202, 28, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(203, 28, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(204, 28, 18, 'Good ', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:00:14', '2026-08-18 07:00:14'),
(205, 36, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(206, 36, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(207, 36, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(208, 36, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(209, 36, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(210, 36, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(211, 36, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(212, 36, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(213, 36, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(214, 36, 18, '.', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(215, 14, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(216, 14, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(217, 14, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(218, 14, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(219, 14, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(220, 14, 14, NULL, 2.00, 97, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(221, 14, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(222, 14, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(223, 14, 17, NULL, 5.00, 130, NULL, NULL, 2, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(224, 14, 18, 'Try to provide information about the visa and the main thing is the amount which is required for students ', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:00:36', '2026-08-18 07:00:36'),
(225, 31, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(226, 31, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(227, 31, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(228, 31, 11, NULL, 5.00, 70, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(229, 31, 13, NULL, 5.00, 90, NULL, NULL, 3, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(230, 31, 14, NULL, 5.00, 100, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(231, 31, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(232, 31, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(233, 31, 17, NULL, 5.00, 130, NULL, NULL, 2, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(234, 31, 18, 'Good', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:00:38', '2026-08-18 07:00:38'),
(235, 29, 8, NULL, 3.00, 38, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(236, 29, 9, NULL, 2.00, 47, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(237, 29, 10, NULL, 3.00, 58, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(238, 29, 11, NULL, 2.00, 67, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(239, 29, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(240, 29, 14, NULL, 3.00, 98, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(241, 29, 15, NULL, 3.00, 108, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(242, 29, 16, NULL, 3.00, 118, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(243, 29, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(244, 29, 18, 'Good', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:00:41', '2026-08-18 07:00:41'),
(245, 32, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(246, 32, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(247, 32, 10, NULL, 3.00, 58, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(248, 32, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(249, 32, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(250, 32, 14, NULL, 3.00, 98, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(251, 32, 15, NULL, 3.00, 108, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(252, 32, 16, NULL, 3.00, 118, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(253, 32, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(254, 32, 18, '..', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:00:53', '2026-08-18 07:00:53'),
(255, 30, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(256, 30, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(257, 30, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(258, 30, 11, NULL, 3.00, 68, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(259, 30, 13, NULL, 2.00, 87, NULL, NULL, 3, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(260, 30, 14, NULL, 2.00, 97, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(261, 30, 15, NULL, 3.00, 108, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(262, 30, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(263, 30, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(264, 30, 18, 'Should have explained more about procedures', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:01:01', '2026-08-18 07:01:01'),
(265, 20, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(266, 20, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(267, 20, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(268, 20, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(269, 20, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(270, 20, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(271, 20, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(272, 20, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(273, 20, 17, NULL, 1.00, 126, NULL, NULL, 2, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(274, 20, 18, 'Nothing ', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:01:22', '2026-08-18 07:01:22'),
(275, 27, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(276, 27, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(277, 27, 10, NULL, 3.00, 58, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(278, 27, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(279, 27, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(280, 27, 14, NULL, 3.00, 98, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(281, 27, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(282, 27, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(283, 27, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(284, 27, 18, 'Instead of just talking about how things are good outside, we need to know overall real experience being in there\nSo it would be better if they organise a talk with someone who\'s actually working there', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:01:37', '2026-08-18 07:01:37'),
(285, 35, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(286, 35, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(287, 35, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(288, 35, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(289, 35, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(290, 35, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(291, 35, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(292, 35, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(293, 35, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(294, 35, 18, 'Ntg', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:02:30', '2026-08-18 07:02:30'),
(295, 7, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(296, 7, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(297, 7, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(298, 7, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(299, 7, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(300, 7, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(301, 7, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(302, 7, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(303, 7, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(304, 7, 18, '..', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:06:14', '2026-08-18 07:06:14'),
(305, 37, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(306, 37, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(307, 37, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(308, 37, 11, NULL, 5.00, 70, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(309, 37, 13, NULL, 5.00, 90, NULL, NULL, 3, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(310, 37, 14, NULL, 5.00, 100, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(311, 37, 15, NULL, 5.00, 110, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(312, 37, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(313, 37, 17, NULL, 5.00, 130, NULL, NULL, 2, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(314, 37, 18, 'Good ', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:10:21', '2026-08-18 07:10:21'),
(315, 33, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(316, 33, 9, NULL, 4.00, 49, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(317, 33, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(318, 33, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(319, 33, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(320, 33, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(321, 33, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(322, 33, 16, NULL, 4.00, 119, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(323, 33, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(324, 33, 18, 'No questions', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:12:50', '2026-08-18 07:12:50'),
(325, 34, 8, NULL, 5.00, 40, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(326, 34, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(327, 34, 10, NULL, 5.00, 60, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(328, 34, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(329, 34, 13, NULL, 4.00, 89, NULL, NULL, 3, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(330, 34, 14, NULL, 4.00, 99, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(331, 34, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(332, 34, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(333, 34, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(334, 34, 18, 'No suggestions', NULL, NULL, NULL, NULL, 5, '2026-08-18 07:16:10', '2026-08-18 07:16:10'),
(335, 38, 8, NULL, 4.00, 39, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(336, 38, 9, NULL, 5.00, 50, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(337, 38, 10, NULL, 4.00, 59, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(338, 38, 11, NULL, 4.00, 69, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(339, 38, 13, NULL, 3.00, 88, NULL, NULL, 3, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(340, 38, 14, NULL, 5.00, 100, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(341, 38, 15, NULL, 4.00, 109, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(342, 38, 16, NULL, 5.00, 120, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(343, 38, 17, NULL, 4.00, 129, NULL, NULL, 2, '2026-08-18 10:35:19', '2026-08-18 10:35:19'),
(344, 38, 18, 'GOOD', NULL, NULL, NULL, NULL, 5, '2026-08-18 10:35:19', '2026-08-18 10:35:19');

-- --------------------------------------------------------

--
-- Table structure for table `survey_audit_log`
--

CREATE TABLE `survey_audit_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `survey_id` int(10) UNSIGNED NOT NULL,
  `actor_id` int(10) UNSIGNED DEFAULT NULL,
  `actor_name` varchar(255) DEFAULT NULL,
  `action` varchar(48) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `survey_audit_log`
--

INSERT INTO `survey_audit_log` (`id`, `college_id`, `survey_id`, `actor_id`, `actor_name`, `action`, `metadata`, `created_at`) VALUES
(1, 1, 2, 6, 'Madhu BK', 'CREATED', '{\"title\":\"Over Seas Study Presentation\"}', '2026-08-18 06:40:10'),
(2, 1, 2, 6, 'Madhu BK', 'PUBLISHED', '{\"effectiveStatus\":\"ACTIVE\"}', '2026-08-18 06:46:11');

-- --------------------------------------------------------

--
-- Table structure for table `survey_links`
--

CREATE TABLE `survey_links` (
  `id` int(10) UNSIGNED NOT NULL,
  `survey_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(16) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `survey_links`
--

INSERT INTO `survey_links` (`id`, `survey_id`, `code`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'SEFUX4', 1, '2026-08-13 06:44:24', '2026-08-13 06:44:24'),
(2, 2, 'JNQZWT', 1, '2026-08-18 06:46:11', '2026-08-18 06:46:11');

-- --------------------------------------------------------

--
-- Table structure for table `survey_sections`
--

CREATE TABLE `survey_sections` (
  `id` int(10) UNSIGNED NOT NULL,
  `survey_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `survey_sections`
--

INSERT INTO `survey_sections` (`id`, `survey_id`, `title`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'Teaching & Learning', NULL, 0, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(2, 1, 'Course Content', NULL, 1, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(3, 1, 'Suggestions', NULL, 2, '2026-08-13 04:53:09', '2026-08-13 04:53:09'),
(4, 2, 'Section 1', 'General feedback', 0, '2026-08-18 06:40:10', '2026-08-18 06:40:10');

-- --------------------------------------------------------

--
-- Table structure for table `survey_submissions`
--

CREATE TABLE `survey_submissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `survey_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `college_id` int(10) UNSIGNED NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `submitted_at` timestamp NULL DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'STARTED',
  `ip_address` varchar(64) DEFAULT NULL,
  `device_information` varchar(512) DEFAULT NULL,
  `attempt_number` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `survey_submissions`
--

INSERT INTO `survey_submissions` (`id`, `survey_id`, `student_id`, `college_id`, `started_at`, `submitted_at`, `status`, `ip_address`, `device_information`, `attempt_number`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-08-13 06:46:14', '2026-08-13 06:46:14', 'COMPLETED', '152.57.70.47', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-13 06:45:26', '2026-08-13 06:45:26'),
(2, 1, 2, 1, '2026-08-13 06:47:11', '2026-08-13 06:47:11', 'COMPLETED', '106.193.42.222', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', 1, '2026-08-13 06:45:57', '2026-08-13 06:45:57'),
(3, 2, 3, 1, '2026-08-18 06:54:04', '2026-08-18 06:54:04', 'COMPLETED', '27.61.34.169', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Safari/605.1.15', 1, '2026-08-18 06:53:36', '2026-08-18 06:53:36'),
(4, 2, 4, 1, '2026-08-18 06:56:11', '2026-08-18 06:56:11', 'COMPLETED', '106.202.98.115', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1', 1, '2026-08-18 06:55:35', '2026-08-18 06:55:35'),
(5, 2, 5, 1, '2026-08-18 06:57:24', '2026-08-18 06:57:24', 'COMPLETED', '106.216.227.43', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:55:44', '2026-08-18 06:55:44'),
(6, 2, 6, 1, '2026-08-18 06:57:58', '2026-08-18 06:57:58', 'COMPLETED', '27.61.44.106', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:55:44', '2026-08-18 06:55:44'),
(7, 2, 7, 1, '2026-08-18 07:06:14', '2026-08-18 07:06:14', 'COMPLETED', '106.216.233.243', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:55:48', '2026-08-18 06:55:48'),
(8, 2, 8, 1, '2026-08-18 06:55:50', NULL, 'STARTED', '152.57.67.217', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:55:50', '2026-08-18 06:55:50'),
(9, 2, 9, 1, '2026-08-18 06:59:19', '2026-08-18 06:59:19', 'COMPLETED', '27.61.37.245', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:56:06', '2026-08-18 06:56:06'),
(10, 2, 10, 1, '2026-08-18 06:59:30', '2026-08-18 06:59:30', 'COMPLETED', '152.57.31.219', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1', 1, '2026-08-18 06:56:10', '2026-08-18 06:56:10'),
(11, 2, 1, 1, '2026-08-18 06:57:16', '2026-08-18 06:57:16', 'COMPLETED', '152.57.74.82', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:56:19', '2026-08-18 06:56:19'),
(12, 2, 11, 1, '2026-08-18 06:56:21', NULL, 'STARTED', '157.50.66.23', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:56:21', '2026-08-18 06:56:21'),
(13, 2, 12, 1, '2026-08-18 06:58:25', '2026-08-18 06:58:25', 'COMPLETED', '152.57.27.194', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1', 1, '2026-08-18 06:56:22', '2026-08-18 06:56:22'),
(14, 2, 13, 1, '2026-08-18 07:00:36', '2026-08-18 07:00:36', 'COMPLETED', '152.57.44.120', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1', 1, '2026-08-18 06:56:22', '2026-08-18 06:56:22'),
(15, 2, 14, 1, '2026-08-18 06:58:29', '2026-08-18 06:58:29', 'COMPLETED', '152.57.17.205', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:56:25', '2026-08-18 06:56:25'),
(16, 2, 15, 1, '2026-08-18 06:58:28', '2026-08-18 06:58:28', 'COMPLETED', '152.57.49.26', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:56:34', '2026-08-18 06:56:34'),
(17, 2, 16, 1, '2026-08-18 06:57:36', '2026-08-18 06:57:36', 'COMPLETED', '152.57.72.214', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:57:14', '2026-08-18 06:57:14'),
(18, 2, 17, 1, '2026-08-18 06:59:48', '2026-08-18 06:59:48', 'COMPLETED', '106.192.246.133', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:57:15', '2026-08-18 06:57:15'),
(19, 2, 18, 1, '2026-08-18 06:58:00', '2026-08-18 06:58:00', 'COMPLETED', '157.50.161.5', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:57:37', '2026-08-18 06:57:37'),
(20, 2, 19, 1, '2026-08-18 07:01:22', '2026-08-18 07:01:22', 'COMPLETED', '152.57.135.174', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:57:40', '2026-08-18 06:57:40'),
(21, 2, 20, 1, '2026-08-18 06:57:59', NULL, 'STARTED', '106.193.57.102', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:57:59', '2026-08-18 06:57:59'),
(22, 2, 21, 1, '2026-08-18 06:58:33', '2026-08-18 06:58:33', 'COMPLETED', '106.202.108.218', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:03', '2026-08-18 06:58:03'),
(23, 2, 2, 1, '2026-08-18 06:58:41', '2026-08-18 06:58:41', 'COMPLETED', '106.216.164.203', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:08', '2026-08-18 06:58:08'),
(24, 2, 22, 1, '2026-08-18 06:59:18', '2026-08-18 06:59:18', 'COMPLETED', '27.61.37.106', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:10', '2026-08-18 06:58:10'),
(25, 2, 23, 1, '2026-08-18 06:59:51', '2026-08-18 06:59:51', 'COMPLETED', '152.57.132.64', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:13', '2026-08-18 06:58:13'),
(26, 2, 24, 1, '2026-08-18 06:59:06', '2026-08-18 06:59:06', 'COMPLETED', '157.50.186.171', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:25', '2026-08-18 06:58:25'),
(27, 2, 25, 1, '2026-08-18 07:01:37', '2026-08-18 07:01:37', 'COMPLETED', '106.192.225.244', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:29', '2026-08-18 06:58:29'),
(28, 2, 26, 1, '2026-08-18 07:00:14', '2026-08-18 07:00:14', 'COMPLETED', '106.202.111.144', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:37', '2026-08-18 06:58:37'),
(29, 2, 27, 1, '2026-08-18 07:00:41', '2026-08-18 07:00:41', 'COMPLETED', '157.50.64.119', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:45', '2026-08-18 06:58:45'),
(30, 2, 28, 1, '2026-08-18 07:01:01', '2026-08-18 07:01:01', 'COMPLETED', '27.63.247.107', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:58:51', '2026-08-18 06:58:51'),
(31, 2, 29, 1, '2026-08-18 07:00:38', '2026-08-18 07:00:38', 'COMPLETED', '152.57.124.238', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1', 1, '2026-08-18 06:58:54', '2026-08-18 06:58:54'),
(32, 2, 30, 1, '2026-08-18 07:00:53', '2026-08-18 07:00:53', 'COMPLETED', '157.50.68.72', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:59:21', '2026-08-18 06:59:21'),
(33, 2, 31, 1, '2026-08-18 07:12:50', '2026-08-18 07:12:50', 'COMPLETED', '157.50.68.9', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:59:24', '2026-08-18 06:59:24'),
(34, 2, 32, 1, '2026-08-18 07:16:10', '2026-08-18 07:16:10', 'COMPLETED', '106.202.99.138', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:59:26', '2026-08-18 06:59:26'),
(35, 2, 33, 1, '2026-08-18 07:02:30', '2026-08-18 07:02:30', 'COMPLETED', '152.57.45.95', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:59:31', '2026-08-18 06:59:31'),
(36, 2, 34, 1, '2026-08-18 07:00:36', '2026-08-18 07:00:36', 'COMPLETED', '152.57.118.106', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 06:59:59', '2026-08-18 06:59:59'),
(37, 2, 35, 1, '2026-08-18 07:10:21', '2026-08-18 07:10:21', 'COMPLETED', '223.237.161.73', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 07:10:00', '2026-08-18 07:10:00'),
(38, 2, 36, 1, '2026-08-18 10:35:19', '2026-08-18 10:35:19', 'COMPLETED', '157.50.64.172', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 10:34:33', '2026-08-18 10:34:33'),
(39, 2, 37, 1, '2026-08-18 11:19:04', NULL, 'STARTED', '152.57.73.204', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', 1, '2026-08-18 11:19:04', '2026-08-18 11:19:04'),
(40, 2, 38, 1, '2026-08-18 13:53:05', NULL, 'STARTED', '106.221.205.46', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', 1, '2026-08-18 13:53:05', '2026-08-18 13:53:05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `academic_years_college_id_label_unique` (`college_id`,`label`);

--
-- Indexes for table `class_sections`
--
ALTER TABLE `class_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_sections_college_id_department_id_label_unique` (`college_id`,`department_id`,`label`),
  ADD KEY `class_sections_department_id_foreign` (`department_id`);

--
-- Indexes for table `colleges`
--
ALTER TABLE `colleges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `colleges_code_unique` (`code`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `courses_college_id_code_unique` (`college_id`,`code`),
  ADD KEY `courses_department_id_foreign` (`department_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_college_id_code_unique` (`college_id`,`code`);

--
-- Indexes for table `faculty_users`
--
ALTER TABLE `faculty_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `faculty_users_college_id_email_unique` (`college_id`,`email`),
  ADD UNIQUE KEY `faculty_users_email_global_unique` (`email`),
  ADD UNIQUE KEY `faculty_users_college_employee_unique` (`college_id`,`employee_id`),
  ADD KEY `faculty_users_department_id_foreign` (`department_id`);

--
-- Indexes for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  ADD PRIMARY KEY (`index`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `programs_college_id_code_unique` (`college_id`,`code`),
  ADD KEY `programs_department_id_foreign` (`department_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `questions_section_id_foreign` (`section_id`),
  ADD KEY `questions_survey_id_sort_order_index` (`survey_id`,`sort_order`);

--
-- Indexes for table `question_bank_items`
--
ALTER TABLE `question_bank_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_bank_items_college_id_foreign` (`college_id`),
  ADD KEY `question_bank_items_created_by_foreign` (`created_by`);

--
-- Indexes for table `question_bank_tags`
--
ALTER TABLE `question_bank_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `question_bank_tags_question_bank_item_id_tag_unique` (`question_bank_item_id`,`tag`);

--
-- Indexes for table `question_options`
--
ALTER TABLE `question_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_options_question_id_foreign` (`question_id`);

--
-- Indexes for table `semesters`
--
ALTER TABLE `semesters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `semesters_college_id_label_unique` (`college_id`,`label`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_college_id_usn_unique` (`college_id`,`usn`),
  ADD KEY `students_department_id_foreign` (`department_id`);

--
-- Indexes for table `surveys`
--
ALTER TABLE `surveys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `surveys_created_by_foreign` (`created_by`),
  ADD KEY `surveys_academic_year_id_foreign` (`academic_year_id`),
  ADD KEY `surveys_semester_id_foreign` (`semester_id`),
  ADD KEY `surveys_department_id_foreign` (`department_id`),
  ADD KEY `surveys_course_id_foreign` (`course_id`),
  ADD KEY `surveys_subject_faculty_id_foreign` (`subject_faculty_id`),
  ADD KEY `surveys_class_section_id_foreign` (`class_section_id`),
  ADD KEY `surveys_college_id_status_index` (`college_id`,`status`),
  ADD KEY `surveys_college_id_created_by_index` (`college_id`,`created_by`);

--
-- Indexes for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_answers_submission_id_question_id_unique` (`submission_id`,`question_id`),
  ADD KEY `survey_answers_question_id_foreign` (`question_id`),
  ADD KEY `survey_answers_selected_option_id_foreign` (`selected_option_id`);

--
-- Indexes for table `survey_audit_log`
--
ALTER TABLE `survey_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `survey_audit_log_college_id_foreign` (`college_id`),
  ADD KEY `survey_audit_log_actor_id_foreign` (`actor_id`),
  ADD KEY `survey_audit_log_survey_id_created_at_index` (`survey_id`,`created_at`);

--
-- Indexes for table `survey_links`
--
ALTER TABLE `survey_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_links_code_unique` (`code`),
  ADD KEY `survey_links_survey_id_foreign` (`survey_id`);

--
-- Indexes for table `survey_sections`
--
ALTER TABLE `survey_sections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `survey_sections_survey_id_foreign` (`survey_id`);

--
-- Indexes for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `survey_submissions_student_id_foreign` (`student_id`),
  ADD KEY `survey_submissions_college_id_foreign` (`college_id`),
  ADD KEY `survey_submissions_survey_id_student_id_index` (`survey_id`,`student_id`),
  ADD KEY `survey_submissions_survey_id_status_index` (`survey_id`,`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `class_sections`
--
ALTER TABLE `class_sections`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `colleges`
--
ALTER TABLE `colleges`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `faculty_users`
--
ALTER TABLE `faculty_users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  MODIFY `index` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `question_bank_items`
--
ALTER TABLE `question_bank_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `question_bank_tags`
--
ALTER TABLE `question_bank_tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `question_options`
--
ALTER TABLE `question_options`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT for table `semesters`
--
ALTER TABLE `semesters`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `surveys`
--
ALTER TABLE `surveys`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `survey_answers`
--
ALTER TABLE `survey_answers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=345;

--
-- AUTO_INCREMENT for table `survey_audit_log`
--
ALTER TABLE `survey_audit_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `survey_links`
--
ALTER TABLE `survey_links`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `survey_sections`
--
ALTER TABLE `survey_sections`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD CONSTRAINT `academic_years_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `class_sections`
--
ALTER TABLE `class_sections`
  ADD CONSTRAINT `class_sections_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_sections_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `courses_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `faculty_users`
--
ALTER TABLE `faculty_users`
  ADD CONSTRAINT `faculty_users_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `faculty_users_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `programs_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `programs_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `questions_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `survey_sections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `questions_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `question_bank_items`
--
ALTER TABLE `question_bank_items`
  ADD CONSTRAINT `question_bank_items_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `question_bank_items_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `faculty_users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `question_bank_tags`
--
ALTER TABLE `question_bank_tags`
  ADD CONSTRAINT `question_bank_tags_question_bank_item_id_foreign` FOREIGN KEY (`question_bank_item_id`) REFERENCES `question_bank_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `question_options`
--
ALTER TABLE `question_options`
  ADD CONSTRAINT `question_options_question_id_foreign` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `semesters`
--
ALTER TABLE `semesters`
  ADD CONSTRAINT `semesters_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `students_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `surveys`
--
ALTER TABLE `surveys`
  ADD CONSTRAINT `surveys_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `surveys_class_section_id_foreign` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `surveys_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `surveys_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `surveys_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `faculty_users` (`id`),
  ADD CONSTRAINT `surveys_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `surveys_semester_id_foreign` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `surveys_subject_faculty_id_foreign` FOREIGN KEY (`subject_faculty_id`) REFERENCES `faculty_users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD CONSTRAINT `survey_answers_question_id_foreign` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_answers_selected_option_id_foreign` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `survey_answers_submission_id_foreign` FOREIGN KEY (`submission_id`) REFERENCES `survey_submissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_audit_log`
--
ALTER TABLE `survey_audit_log`
  ADD CONSTRAINT `survey_audit_log_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `faculty_users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `survey_audit_log_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_audit_log_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_links`
--
ALTER TABLE `survey_links`
  ADD CONSTRAINT `survey_links_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_sections`
--
ALTER TABLE `survey_sections`
  ADD CONSTRAINT `survey_sections_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  ADD CONSTRAINT `survey_submissions_college_id_foreign` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_submissions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `survey_submissions_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
