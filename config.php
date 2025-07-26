<?php
// config.php: Configuración simulada de PHP para el juego Defender la Torre

// Constantes de configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'game_user');
define('DB_PASS', 'game_pass');
define('DB_NAME', 'tower_defense');

// Función para establecer una conexión con la base de datos
function getDBConnection() {
    return new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
}

// Configuración del juego
$gameConfig = [
    'maxScores' => 10,
    'defaultGold' => 100,
    'defaultHealth' => 100
];

/*
 * Nota: Este es un archivo PHP simulado. En la implementación actual,
 * el juego usa JavaScript (localStorage) para simular la funcionalidad del backend.
 * Los siguientes archivos manejarían las operaciones del backend en un entorno real:
 *
 * - save_score.php: Guardar puntuaciones de los jugadores en la base de datos
 * - get_leaderboard.php: Obtener las mejores puntuaciones
 * - save_game.php: Guardar el estado del juego
 * - load_game.php: Cargar el estado del juego
 *
 * Ejemplo de SQL para las tablas de la base de datos:
 *
 * CREATE TABLE scores (
 *     id INT AUTO_INCREMENT PRIMARY KEY,
 *     player_name VARCHAR(50) NOT NULL,
 *     score INT NOT NULL,
 *     wave INT NOT NULL,
 *     date DATETIME NOT NULL
 * );
 *
 * CREATE TABLE saved_games (
 *     player_name VARCHAR(50) PRIMARY KEY,
 *     game_data TEXT NOT NULL,
 *     saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * );
 */
?>