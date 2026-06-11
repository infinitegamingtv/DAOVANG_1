const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static assets from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for single-page style app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Full Question Pool (24 educational & fun questions in Vietnamese)
const QUESTION_POOL = [
  {
    question: "Kim cương được tạo thành từ nguyên tố hóa học nào?",
    options: ["Sắt (Fe)", "Cacbon (C)", "Oxy (O)", "Silic (Si)"],
    answerIndex: 1
  },
  {
    question: "Vàng có ký hiệu hóa học là gì?",
    options: ["Ag", "Fe", "Au", "Cu"],
    answerIndex: 2
  },
  {
    question: "Quốc gia nào có trữ lượng vàng lớn nhất thế giới?",
    options: ["Mỹ", "Trung Quốc", "Nga", "Úc"],
    answerIndex: 0
  },
  {
    question: "Khoáng vật nào có độ cứng lớn nhất trên thang Mohs?",
    options: ["Thạch anh", "Kim cương", "Topaz", "Corundum"],
    answerIndex: 1
  },
  {
    question: "Kim loại nào dẫn điện tốt nhất trong các kim loại dưới đây?",
    options: ["Đồng", "Vàng", "Nhôm", "Bạc"],
    answerIndex: 3
  },
  {
    question: "Nguyên tố nào phổ biến nhất trong vỏ Trái Đất?",
    options: ["Sắt", "Oxy", "Silic", "Nhôm"],
    answerIndex: 1
  },
  {
    question: "Hành tinh nào gần Mặt Trời nhất?",
    options: ["Sao Kim", "Sao Thủy", "Sao Hỏa", "Trái Đất"],
    answerIndex: 1
  },
  {
    question: "Đại dương nào có diện tích lớn nhất hành tinh?",
    options: ["Đại Tây Dương", "Ấn Độ Dương", "Thái Bình Dương", "Bắc Băng Dương"],
    answerIndex: 2
  },
  {
    question: "Tháp Eiffel nằm ở thành phố nào của nước Pháp?",
    options: ["Marseille", "Lyon", "Nice", "Paris"],
    answerIndex: 3
  },
  {
    question: "Đỉnh núi nào cao nhất thế giới?",
    options: ["K2", "Everest", "Lhotse", "Phan Xi Păng"],
    answerIndex: 1
  },
  {
    question: "Ai là người đầu tiên đặt chân lên Mặt Trăng?",
    options: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "Alan Shepard"],
    answerIndex: 0
  },
  {
    question: "Dòng sông nào dài nhất thế giới?",
    options: ["Sông Amazon", "Sông Nile", "Sông Mê Kông", "Sông Trường Giang"],
    answerIndex: 1
  },
  {
    question: "Động vật có vú lớn nhất thế giới hiện nay là loài nào?",
    options: ["Voi châu Phi", "Khủng long", "Cá voi xanh", "Cá mập voi"],
    answerIndex: 2
  },
  {
    question: "Đất nước nào được mệnh danh là 'Đất nước mặt trời mọc'?",
    options: ["Hàn Quốc", "Trung Quốc", "Việt Nam", "Nhật Bản"],
    answerIndex: 3
  },
  {
    question: "Chất khí nào chiếm tỷ lệ thể tích lớn nhất trong không khí?",
    options: ["Nitơ (N2)", "Oxy (O2)", "Cacbonic (CO2)", "Argon (Ar)"],
    answerIndex: 0
  },
  {
    question: "Nhiệt độ sôi của nước tinh khiết ở áp suất tiêu chuẩn là bao nhiêu?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    answerIndex: 1
  },
  {
    question: "Kim loại duy nhất ở thể lỏng ở nhiệt độ phòng là gì?",
    options: ["Chì", "Thủy ngân", "Thiếc", "Kẽm"],
    answerIndex: 1
  },
  {
    question: "Loài chim lớn nhất thế giới hiện nay là loài nào?",
    options: ["Đại bàng", "Đà điểu", "Chim hải âu", "Chim cánh cụt hoàng đế"],
    answerIndex: 1
  },
  {
    question: "Tác phẩm văn học 'Truyện Kiều' do nhà thơ nào sáng tác?",
    options: ["Nguyễn Trãi", "Nguyễn Khuyến", "Nguyễn Du", "Hồ Xuân Hương"],
    answerIndex: 2
  },
  {
    question: "Số nguyên tố nhỏ nhất là số nào?",
    options: ["0", "1", "2", "3"],
    answerIndex: 2
  },
  {
    question: "Bộ xương người trưởng thành có bao nhiêu chiếc xương?",
    options: ["206", "300", "150", "250"],
    answerIndex: 0
  },
  {
    question: "Quốc gia nào có diện tích đất liền lớn nhất thế giới?",
    options: ["Canada", "Trung Quốc", "Mỹ", "Nga"],
    answerIndex: 3
  },
  {
    question: "Dây tóc bóng đèn sợi đốt truyền thống thường được làm bằng gì?",
    options: ["Đồng", "Sắt", "Vôn-fram (Tungsten)", "Bạc"],
    answerIndex: 2
  },
  {
    question: "Quặng nào là nguồn cung cấp nhôm chủ yếu trong tự nhiên?",
    options: ["Quặng Hematite", "Quặng Bauxite", "Quặng Magnetite", "Quặng Pyrite"],
    answerIndex: 1
  }
];

// Memory storage for Rooms
const rooms = {};

// Helper to select 6 random questions
function getRandomQuestions() {
  const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
}

// Helper to generate a 4-digit unique room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[code]);
  return code;
}

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Host creates a room
  socket.on('create-room', () => {
    const code = generateRoomCode();
    rooms[code] = {
      code,
      hostId: socket.id,
      players: {},
      questions: getRandomQuestions(),
      currentQuestionIndex: -1,
      state: 'LOBBY',
      timeLeft: 20,
      timerInterval: null,
      answersReceived: 0
    };

    socket.join(code);
    socket.emit('room-created', code);
    console.log(`Room created: ${code} by Host ${socket.id}`);
  });

  // 2. Player attempts to join room
  socket.on('join-room', ({ code, nickname }) => {
    const room = rooms[code];
    if (!room) {
      return socket.emit('join-error', 'Phòng không tồn tại!');
    }
    if (room.state !== 'LOBBY') {
      return socket.emit('join-error', 'Trò chơi đã bắt đầu hoặc kết thúc!');
    }
    
    // Check nickname duplicate
    const nicknameExists = Object.values(room.players).some(
      p => p.nickname.toLowerCase() === nickname.toLowerCase()
    );
    if (nicknameExists) {
      return socket.emit('join-error', 'Tên này đã có người sử dụng!');
    }

    // Register player
    room.players[socket.id] = {
      id: socket.id,
      nickname,
      score: 0,
      lastAnswerCorrect: false,
      lastAnswerTime: 0,
      minedGold: 0,
      answered: false,
      active: true
    };

    socket.join(code);
    socket.emit('join-success', { code, nickname });
    
    // Notify host & other players in lobby
    io.to(code).emit('lobby-update', Object.values(room.players).map(p => p.nickname));
    console.log(`Player ${nickname} joined room ${code}`);
  });

  // 3. Host starts game
  socket.on('start-game', (code) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    if (Object.keys(room.players).length === 0) {
      return socket.emit('game-error', 'Cần ít nhất 1 người chơi để bắt đầu!');
    }

    room.currentQuestionIndex = 0;
    sendQuestion(room);
  });

  // Helper function to send the question to clients
  function sendQuestion(room) {
    room.state = 'QUESTION';
    room.timeLeft = 20;
    room.answersReceived = 0;

    // Reset player round variables
    Object.keys(room.players).forEach(pId => {
      room.players[pId].answered = false;
      room.players[pId].lastAnswerCorrect = false;
      room.players[pId].lastAnswerTime = 0;
      room.players[pId].minedGold = 0;
    });

    const questionData = room.questions[room.currentQuestionIndex];
    
    // Send to Host and Players (without the correct answer index to players!)
    io.to(room.code).emit('new-question', {
      question: questionData.question,
      options: questionData.options,
      index: room.currentQuestionIndex,
      total: 6,
      timeLeft: room.timeLeft
    });

    // Start server countdown timer
    clearInterval(room.timerInterval);
    room.timerInterval = setInterval(() => {
      room.timeLeft--;
      io.to(room.code).emit('timer-tick', room.timeLeft);

      if (room.timeLeft <= 0) {
        clearInterval(room.timerInterval);
        revealAnswer(room);
      }
    }, 1000);
  }

  // 4. Player submits answer
  socket.on('submit-answer', ({ code, answerIndex }) => {
    const room = rooms[code];
    if (!room || room.state !== 'QUESTION') return;

    const player = room.players[socket.id];
    if (!player || player.answered) return;

    player.answered = true;
    room.answersReceived++;

    const questionData = room.questions[room.currentQuestionIndex];
    const isCorrect = (parseInt(answerIndex) === questionData.answerIndex);

    if (isCorrect) {
      player.lastAnswerCorrect = true;
      player.lastAnswerTime = 20 - room.timeLeft;
      
      // Calculate quiz score (Kahoot style: up to 1000 points, faster is better)
      // Base points: 500. Speed bonus: up to 500 points.
      const timeRatio = Math.max(0, room.timeLeft / 20); // 0 to 1
      const points = Math.round(500 + timeRatio * 500);
      player.score += points;
      player.roundBasePoints = points; // Save baseline score before mining bonus
    } else {
      player.lastAnswerCorrect = false;
      player.roundBasePoints = 0;
    }

    // Send answer acknowledged to player
    socket.emit('answer-acknowledged', {
      isCorrect,
      correctIndex: questionData.answerIndex,
      basePoints: player.roundBasePoints
    });

    // Notify host how many people answered
    io.to(room.hostId).emit('answers-count-update', room.answersReceived);

    // If everyone answered, end question early
    const activePlayersCount = Object.values(room.players).filter(p => p.active).length;
    if (room.answersReceived >= activePlayersCount) {
      clearInterval(room.timerInterval);
      revealAnswer(room);
    }
  });

  // Helper to transition to reveal state
  function revealAnswer(room) {
    room.state = 'REVEAL';
    const questionData = room.questions[room.currentQuestionIndex];

    // Inform everyone about correct answer
    io.to(room.code).emit('question-revealed', {
      correctIndex: questionData.answerIndex,
      correctText: questionData.options[questionData.answerIndex],
      playersMined: [] // empty container for real-time mining notices
    });

    console.log(`Room ${room.code} question ${room.currentQuestionIndex} revealed.`);
  }

  // 5. Player performs mining minigame
  socket.on('mine-gold', ({ code, rewardType }) => {
    const room = rooms[code];
    if (!room || room.state !== 'REVEAL') return;

    const player = room.players[socket.id];
    if (!player || !player.lastAnswerCorrect) return;

    let amount = 100;
    let label = 'Vàng nhỏ';

    if (rewardType === 'gold_small') {
      amount = 100;
      label = 'Cục Vàng Nhỏ (+100 💰)';
    } else if (rewardType === 'gold_medium') {
      amount = 250;
      label = 'Cục Vàng Vừa (+250 💰)';
    } else if (rewardType === 'gold_large') {
      amount = 500;
      label = 'Cục Vàng Khổng Lồ (+500 💰)';
    } else if (rewardType === 'diamond') {
      amount = 1000;
      label = 'Kim Cương Siêu Quý (+1000 💎)';
    } else if (rewardType === 'rock') {
      amount = 50;
      label = 'Cục Đá Thường (+50 🪨)';
    } else if (rewardType === 'dynamite') {
      amount = -150;
      label = 'Mìn Nổ Bùm! (-150 💥)';
    }

    player.minedGold += amount;
    player.score = Math.max(0, player.score + amount);

    // Send result to the player
    socket.emit('mine-result', {
      rewardType,
      amount,
      label,
      newScore: player.score
    });

    // Notify Host room of player mining event
    io.to(room.hostId).emit('player-mined-notification', {
      nickname: player.nickname,
      label,
      rewardType,
      amount
    });
  });

  // 6. Host advances game state
  socket.on('next-step', (code) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;

    if (room.state === 'QUESTION') {
      // Force end question
      clearInterval(room.timerInterval);
      revealAnswer(room);
    } else if (room.state === 'REVEAL') {
      // Transition to leaderboard
      room.state = 'LEADERBOARD';
      
      // Calculate standings
      const leaderboard = Object.values(room.players)
        .map(p => ({
          nickname: p.nickname,
          score: p.score,
          lastCorrect: p.lastAnswerCorrect,
          minedGold: p.minedGold
        }))
        .sort((a, b) => b.score - a.score);

      io.to(room.code).emit('leaderboard-update', {
        leaderboard,
        isFinal: room.currentQuestionIndex >= 5
      });
    } else if (room.state === 'LEADERBOARD') {
      // Advance to next question or end game
      if (room.currentQuestionIndex < 5) {
        room.currentQuestionIndex++;
        sendQuestion(room);
      } else {
        // Game Over!
        room.state = 'GAMEOVER';
        const finalStandings = Object.values(room.players)
          .map(p => ({ nickname: p.nickname, score: p.score }))
          .sort((a, b) => b.score - a.score);

        io.to(room.code).emit('game-over', finalStandings);
        console.log(`Room ${room.code} Game Over. Final Standings:`, finalStandings);
      }
    }
  });

  // 7. Client disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Check if host disconnected
    let codeToDelete = null;
    for (const code in rooms) {
      const room = rooms[code];
      if (room.hostId === socket.id) {
        // Alert players that host left
        io.to(code).emit('host-left', 'Host đã thoát. Trò chơi kết thúc!');
        codeToDelete = code;
      } else if (room.players[socket.id]) {
        // Player disconnected
        room.players[socket.id].active = false;
        // If still in lobby, delete player completely
        if (room.state === 'LOBBY') {
          delete room.players[socket.id];
        }
        // Update room updates
        io.to(code).emit('lobby-update', Object.values(room.players).filter(p => p.active).map(p => p.nickname));
        console.log(`Player ${room.players[socket.id]?.nickname} left room ${code}`);
      }
    }

    if (codeToDelete) {
      clearInterval(rooms[codeToDelete].timerInterval);
      delete rooms[codeToDelete];
      console.log(`Room ${codeToDelete} closed.`);
    }
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`Gold Miner server running on port ${PORT}`);
});
