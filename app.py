
from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

HEADERS = {"User-Agent": "ChessAIAnalyzer/1.0 (contact: mobile_dev@example.com)"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/games/<username>')
def get_games(username):
    archive_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    archive_res = requests.get(archive_url, headers=HEADERS)
    
    if archive_res.status_code != 200:
        return jsonify({"error": "User not found or Chess.com API error."}), 400
        
    archives = archive_res.json().get("archives", [])
    if not archives:
        return jsonify({"error": "No games found for this user."}), 404
        
    latest_month_url = archives[-1]
    games_res = requests.get(latest_month_url, headers=HEADERS)
    
    if games_res.status_code != 200:
        return jsonify({"error": "Failed to retrieve recent games."}), 400
        
    raw_games = games_res.json().get("games", [])
    processed_games = []
    
    for game in raw_games[-5:]:  
        processed_games.append({
            "white": game["white"]["username"],
            "black": game["black"]["username"],
            "result": f"{game['white']['result']} - {game['black']['result']}",
            "pgn": game.get("pgn", "")
        })
        
    return jsonify(processed_games[::-1])

if __name__ == '__main__':
    app.run(debug=True)
          
