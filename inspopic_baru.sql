-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 29, 2026 at 05:36 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inspopic_baru`
--

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(150) NOT NULL,
  `image_url` varchar(2048) NOT NULL,
  `object_key` varchar(1024) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `title`, `image_url`, `object_key`, `created_at`) VALUES
(3, 'Nailong Gemas', 'https://nos.wjv-1.neo.id/eora/uploads/68721fcf-1db2-4b4f-be9e-58055b143bfa.jpg', 'uploads/68721fcf-1db2-4b4f-be9e-58055b143bfa.jpg', '2026-10-27 13:59:27'),
(4, 'Nailong ututututu', 'https://nos.wjv-1.neo.id/eora/uploads/bae915a0-e039-4871-89b6-0c429986b577.jpg', 'uploads/bae915a0-e039-4871-89b6-0c429986b577.jpg', '2026-10-27 13:59:54'),
(5, 'Nailong cute', 'https://nos.wjv-1.neo.id/eora/uploads/598ce910-1c03-4df2-98ec-017c821c4882.jpg', 'uploads/598ce910-1c03-4df2-98ec-017c821c4882.jpg', '2026-10-27 14:00:33'),
(6, 'nailong kesayangan', 'https://nos.wjv-1.neo.id/eora/uploads/5a4257e8-0054-4a05-85e9-615da79bf747.jpg', 'uploads/5a4257e8-0054-4a05-85e9-615da79bf747.jpg', '2026-10-27 14:00:50'),
(7, 'nailong malas', 'https://nos.wjv-1.neo.id/eora/uploads/6131603d-8936-4e8d-8ae2-938ff3c0964a.jpg', 'uploads/6131603d-8936-4e8d-8ae2-938ff3c0964a.jpg', '2026-10-27 14:01:09'),
(8, 'Nailong Berduit', 'https://nos.wjv-1.neo.id/eora/uploads/cf3c1bf5-f11a-46eb-8512-3b69afb3273f.jpg', 'uploads/cf3c1bf5-f11a-46eb-8512-3b69afb3273f.jpg', '2026-10-27 14:03:22'),
(12, 'Nailong Makan Pisang', 'https://nos.wjv-1.neo.id/eora/uploads/c7f86a7b-450a-4ce0-ac48-6d61d49afe32.jpg', 'uploads/c7f86a7b-450a-4ce0-ac48-6d61d49afe32.jpg', '2026-10-28 14:09:44'),
(13, 'Nailong gemas', 'https://nos.wjv-1.neo.id/eora/uploads/4bb2377b-cae0-42c1-8c11-db7887eb5a8d.jpg', 'uploads/4bb2377b-cae0-42c1-8c11-db7887eb5a8d.jpg', '2026-10-28 14:10:02'),
(14, 'Si kuning lagi bobo', 'https://nos.wjv-1.neo.id/eora/uploads/35e6b918-64c1-4ee7-885e-3bff02854eb4.jpg', 'uploads/35e6b918-64c1-4ee7-885e-3bff02854eb4.jpg', '2026-10-28 14:10:19'),
(15, 'Nailong Kepo', 'https://nos.wjv-1.neo.id/eora/uploads/7409c882-d45a-4f52-a85b-1f0297602df1.jpg', 'uploads/7409c882-d45a-4f52-a85b-1f0297602df1.jpg', '2026-10-28 14:11:02'),
(16, 'Nailong Chill', 'https://nos.wjv-1.neo.id/eora/uploads/123f5fd8-d653-420b-8319-96a287a6f14e.jpg', 'uploads/123f5fd8-d653-420b-8319-96a287a6f14e.jpg', '2026-10-28 14:11:17'),
(17, 'Nailon mam', 'https://nos.wjv-1.neo.id/eora/uploads/5422fc03-39ae-4a1b-b0dd-370e2918eb72.jpg', 'uploads/5422fc03-39ae-4a1b-b0dd-370e2918eb72.jpg', '2026-10-28 14:11:31'),
(18, 'Nailong ngejek', 'https://nos.wjv-1.neo.id/eora/uploads/4ce841d1-a392-461d-af59-d4f2aa7b564a.jpg', 'uploads/4ce841d1-a392-461d-af59-d4f2aa7b564a.jpg', '2026-10-28 14:11:49'),
(19, 'Nailong', 'https://nos.wjv-1.neo.id/eora/uploads/f6a09e3d-d4f9-4da8-b367-6503d3a80bd8.jpg', 'uploads/f6a09e3d-d4f9-4da8-b367-6503d3a80bd8.jpg', '2026-10-28 14:12:05'),
(20, 'Nailong gemas sekali', 'https://nos.wjv-1.neo.id/eora/uploads/ffb13cab-a9ff-4d0c-b637-9ed166537534.jpg', 'uploads/ffb13cab-a9ff-4d0c-b637-9ed166537534.jpg', '2026-10-28 14:13:19'),
(21, 'Nailong', 'https://nos.wjv-1.neo.id/eora/uploads/9f3d5a14-800d-4e79-8c32-783a31f9b157.jpg', 'uploads/9f3d5a14-800d-4e79-8c32-783a31f9b157.jpg', '2026-10-28 14:13:47'),
(22, 'Ayam nailong', 'https://nos.wjv-1.neo.id/eora/uploads/ce609bbf-daf1-4c90-b2c8-f015bef30189.jpg', 'uploads/ce609bbf-daf1-4c90-b2c8-f015bef30189.jpg', '2026-10-28 14:14:22'),
(23, 'Nailong Gemas', 'https://nos.wjv-1.neo.id/eora/uploads/b7eeb563-3819-4a59-a4b9-7a4bc7e5a838.jpg', 'uploads/b7eeb563-3819-4a59-a4b9-7a4bc7e5a838.jpg', '2026-10-28 14:15:34'),
(24, 'Nailong main salju', 'https://nos.wjv-1.neo.id/eora/uploads/3cc3eca4-bbf3-4ca9-8ee0-bd6800a96503.jpg', 'uploads/3cc3eca4-bbf3-4ca9-8ee0-bd6800a96503.jpg', '2026-10-28 14:15:57'),
(25, 'Nailong kehujanan', 'https://nos.wjv-1.neo.id/eora/uploads/a0751d0f-0024-46a3-bc57-2a5ca6ba151d.jpg', 'uploads/a0751d0f-0024-46a3-bc57-2a5ca6ba151d.jpg', '2026-10-28 14:16:23'),
(26, 'Nailong Disurga', 'https://nos.wjv-1.neo.id/eora/uploads/5baa5654-5950-43d0-a4b7-fb90a29da612.jpg', 'uploads/5baa5654-5950-43d0-a4b7-fb90a29da612.jpg', '2026-10-28 14:17:06'),
(27, 'Nailong ciss dulu', 'https://nos.wjv-1.neo.id/eora/uploads/b7872dba-7121-442e-b858-4074f1c4033a.jpg', 'uploads/b7872dba-7121-442e-b858-4074f1c4033a.jpg', '2026-10-28 14:17:31'),
(28, 'Nailong ah gemas', 'https://nos.wjv-1.neo.id/eora/uploads/75bad504-5a17-4e26-be8c-e9d515d75b1d.jpg', 'uploads/75bad504-5a17-4e26-be8c-e9d515d75b1d.jpg', '2026-10-28 14:18:07'),
(30, 'Pohon', 'https://nos.wjv-1.neo.id/eora/uploads/16df6e0d-070e-4283-9cf9-77b4b272ade3.jpg', 'uploads/16df6e0d-070e-4283-9cf9-77b4b272ade3.jpg', '2026-10-28 15:09:20');

-- --------------------------------------------------------

--
-- Table structure for table `saved_images`
--

CREATE TABLE `saved_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `image_url` varchar(2048) NOT NULL,
  `title` varchar(150) NOT NULL DEFAULT 'Gambar tersimpan',
  `url_hash` char(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saved_images`
--

INSERT INTO `saved_images` (`id`, `image_url`, `title`, `url_hash`, `created_at`) VALUES
(4, 'https://nos.wjv-1.neo.id/eora/uploads/bae915a0-e039-4871-89b6-0c429986b577.jpg', 'Nailong ututututu', '3d60828ee10705703aef4d9204169371d04c385d05c8ba8b451d26fd15b7e0c7', '2026-10-27 14:05:22'),
(5, 'https://nos.wjv-1.neo.id/eora/uploads/c33e0382-65d7-4be6-8ce9-3ba030071c6f.jpg', 'Nailong cembeyut', 'dec5d8b37a049261ff69502022623b9165e9355e61f107cfe86aee473340dcd7', '2026-10-28 14:45:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_images_created` (`created_at`);

--
-- Indexes for table `saved_images`
--
ALTER TABLE `saved_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_saved_url_hash` (`url_hash`),
  ADD KEY `idx_saved_created` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `saved_images`
--
ALTER TABLE `saved_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
