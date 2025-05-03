<?php
session_start();
require_once '../includes/db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized. Please log in."]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Fetch playlists for the current user with song count
    $stmt = $conn->prepare("
        SELECT p.playlist_id, p.title, p.created_at, COUNT(ps.song_id) as song_count 
        FROM playlists p
        LEFT JOIN playlist_songs ps ON p.playlist_id = ps.playlist_id
        WHERE p.user_id = ?
        GROUP BY p.playlist_id
        ORDER BY p.created_at DESC
    ");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    
    $result = $stmt->get_result();
    $playlists = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Return success response with playlists
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'playlists' => $playlists]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch playlists: ' . $e->getMessage()]);
}

$conn->close();
?>