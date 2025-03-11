from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# 確保數據庫文件的目錄存在
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snake_game.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

def init_db():
    with app.app_context():
        # 創建所有數據表
        db.create_all()
        
        # 檢查是否需要添加測試數據
        if not Score.query.first():
            # 添加一些測試分數
            test_scores = [
                Score(name="k8s", score=999999999),
                # Score(name="測試玩家", score=80),
                # Score(name="測試玩家", score=60)
            ]
            db.session.add_all(test_scores)
            db.session.commit()
            print("初始化測試數據完成！")

# 初始化數據庫
init_db()
print(f"數據庫文件位置: {db_path}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    # 獲取前10名最高分
    top_scores = Score.query.order_by(Score.score.desc()).limit(10).all()
    
    return jsonify([{
        'name': score.name,
        'score': score.score,
        'date': score.date.strftime('%Y-%m-%d %H:%M')
    } for score in top_scores])

@app.route('/api/leaderboard', methods=['POST'])
def add_score():
    data = request.json
    if 'name' in data and 'score' in data:
        # 添加新分數
        new_score = Score(
            name=data['name'],
            score=data['score']
        )
        db.session.add(new_score)
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'success': False}), 400

if __name__ == '__main__':
    app.run(debug=True) 