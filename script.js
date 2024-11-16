class PitchPerfect {
    constructor() {
        this.synth = new Tone.Synth().toDestination();
        this.currentNote = null;
        this.score = 0;
        this.streak = 0;
        this.noteHistory = [];
        this.startTime = null;
        this.hintsRemaining = 3;
        this.setupNotes();
        this.setupEventListeners();
        this.createKeyboard();
        this.updateStats();
    }

    setupNotes() {
        // Define notes for different difficulty levels
        this.noteRanges = {
            beginner: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
            intermediate: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
            advanced: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']
        };
    }

    setupEventListeners() {
        document.getElementById('play-note').addEventListener('click', () => this.playNewNote());
        document.getElementById('hint-button').addEventListener('click', () => this.giveHint());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.createKeyboard();
            this.updateTip();
        });
    }

    createKeyboard() {
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = '';
        const difficulty = document.getElementById('difficulty').value;
        const notes = this.noteRanges[difficulty];

        let whiteKeyIndex = 0;
        notes.forEach((note, index) => {
            const isBlack = note.includes('#');
            const key = document.createElement('div');
            key.className = `key ${isBlack ? 'black-key' : 'white-key'}`;
            key.dataset.note = note;
            key.addEventListener('click', () => this.checkNote(note));

            if (!isBlack) {
                key.style.left = `${whiteKeyIndex * 64}px`;
                whiteKeyIndex++;
            } else {
                key.style.left = `${whiteKeyIndex * 64 - 20}px`;
            }

            keyboard.appendChild(key);
        });
    }

    async playNewNote() {
        await Tone.start();
        const difficulty = document.getElementById('difficulty').value;
        const notes = this.noteRanges[difficulty];
        this.currentNote = notes[Math.floor(Math.random() * notes.length)];
        this.startTime = Date.now();
        this.synth.triggerAttackRelease(this.currentNote, '1n');
        
        document.getElementById('feedback').textContent = 'Listen and click the matching key!';
        this.hintsRemaining = 3;
        document.getElementById('hint-button').disabled = false;
        document.getElementById('hint-text').textContent = '';
    }

    checkNote(selectedNote) {
        if (!this.currentNote) return;

        const reactionTime = (Date.now() - this.startTime) / 1000;
        const isCorrect = selectedNote === this.currentNote;

        if (isCorrect) {
            this.handleCorrectGuess(reactionTime);
        } else {
            this.handleIncorrectGuess(selectedNote);
        }

        this.updateStats();
        this.updateTip();
    }

    handleCorrectGuess(reactionTime) {
        this.streak++;
        this.score += Math.max(10, 100 - Math.floor(reactionTime * 10));
        this.noteHistory.push({
            note: this.currentNote,
            correct: true,
            reactionTime
        });

        document.getElementById('feedback').textContent = '🎉 Correct! Well done!';
        document.getElementById('feedback').style.color = 'var(--success-color)';
    }

    handleIncorrectGuess(selectedNote) {
        this.streak = 0;
        this.noteHistory.push({
            note: this.currentNote,
            correct: false,
            selectedNote
        });

        document.getElementById('feedback').textContent = `❌ Not quite. The correct note was ${this.currentNote}`;
        document.getElementById('feedback').style.color = 'var(--error-color)';
    }

    giveHint() {
        if (this.hintsRemaining <= 0 || !this.currentNote) return;

        this.hintsRemaining--;
        const hintButton = document.getElementById('hint-button');
        const hintText = document.getElementById('hint-text');
        
        if (this.hintsRemaining === 0) {
            hintButton.disabled = true;
        }

        // Generate contextual hints
        const hints = [
            `This note is in the ${this.getNoteOctave(this.currentNote)} octave`,
            `This note is ${this.getRelativePosition(this.currentNote)}`,
            `Think about the relative pitch - it's ${this.getRelativePitch(this.currentNote)}`
        ];

        hintText.textContent = hints[2 - this.hintsRemaining];
    }

    getNoteOctave(note) {
        const octave = note.slice(-1);
        return ['low', 'middle', 'high'][octave - 3] || 'middle';
    }

    getRelativePosition(note) {
        const difficulty = document.getElementById('difficulty').value;
        const notes = this.noteRanges[difficulty];
        const index = notes.indexOf(note);
        if (index <= notes.length * 0.3) return 'in the lower range';
        if (index >= notes.length * 0.7) return 'in the higher range';
        return 'in the middle range';
    }

    getRelativePitch(note) {
        const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const noteName = note.charAt(0);
        const noteIndex = noteNames.indexOf(noteName);
        
        if (noteIndex < 2) return 'a lower pitch';
        if (noteIndex > 4) return 'a higher pitch';
        return 'in the middle of the scale';
    }

    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;

        // Update accuracy chart
        if (this.noteHistory.length > 0) {
            const accuracy = (this.noteHistory.filter(n => n.correct).length / this.noteHistory.length * 100).toFixed(1);
            const accuracyBars = document.getElementById('accuracy-bars');
            accuracyBars.innerHTML = `<div class="accuracy-bar" style="width: ${accuracy}%">${accuracy}%</div>`;
        }

        // Update reaction time graph
        const reactionTimes = this.noteHistory.filter(n => n.correct).map(n => n.reactionTime);
        if (reactionTimes.length > 0) {
            const avgTime = (reactionTimes.reduce((a, b) => a + b) / reactionTimes.length).toFixed(2);
            const reactionGraph = document.getElementById('reaction-graph');
            reactionGraph.innerHTML = `Average: ${avgTime}s`;
        }
    }

    updateTip() {
        const tips = {
            beginner: [
                "Listen for the relative highness or lowness of the note",
                "Try humming along with the note to match its pitch",
                "Start by learning to recognize the extremes (highest and lowest notes)"
            ],
            intermediate: [
                "Pay attention to the octave jumps between notes",
                "Try to identify if a note is in the upper or lower octave first",
                "Practice moving between octaves smoothly"
            ],
            advanced: [
                "Focus on the subtle differences between adjacent notes",
                "Try to develop a reference pitch for each octave",
                "Listen for the harmonic relationships between notes"
            ]
        };

        const difficulty = document.getElementById('difficulty').value;
        const tipList = tips[difficulty];
        const tip = tipList[Math.floor(Math.random() * tipList.length)];
        document.getElementById('training-tip').textContent = tip;
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new PitchPerfect();
});
