class PitchPerfect {
    constructor() {
        this.setupSynths();
        this.currentNote = null;
        this.score = 0;
        this.streak = 0;
        this.hintsRemaining = 3;
        this.startTime = null;
        this.progressStats = {
            totalAttempts: 0,
            correctAttempts: 0,
            noteStats: {},
            commonMistakes: {},
            reactionTimes: []
        };
        
        this.initializeElements();
        this.addEventListeners();
        this.setupDifficulty();
    }

    setupSynths() {
        // Create different instrument synths
        this.instruments = {
            piano: new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination(),
            
            violin: new Tone.FMSynth({
                harmonicity: 3.01,
                modulationIndex: 14,
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.2,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 1.2
                },
                modulation: { type: 'square' },
                modulationEnvelope: {
                    attack: 0.01,
                    decay: 0.5,
                    sustain: 0.2,
                    release: 0.1
                }
            }).toDestination(),

            clarinet: new Tone.AMSynth({
                harmonicity: 1.5,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.1,
                    decay: 0.2,
                    sustain: 1,
                    release: 0.8
                },
                modulation: { type: 'square' },
                modulationEnvelope: {
                    attack: 0.5,
                    decay: 0,
                    sustain: 1,
                    release: 0.5
                }
            }).toDestination(),

            trumpet: new Tone.FMSynth({
                harmonicity: 1,
                modulationIndex: 20,
                oscillator: { type: 'square' },
                envelope: {
                    attack: 0.08,
                    decay: 0.2,
                    sustain: 0.7,
                    release: 0.5
                },
                modulation: { type: 'square' },
                modulationEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.3,
                    release: 0.1
                }
            }).toDestination()
        };
    }

    initializeElements() {
        this.playButton = document.getElementById('play-note');
        this.scoreDisplay = document.getElementById('score');
        this.streakDisplay = document.getElementById('streak');
        this.feedbackDisplay = document.getElementById('feedback');
        this.difficultySelect = document.getElementById('difficulty');
        this.instrumentSelect = document.getElementById('instrument');
        this.hintButton = document.getElementById('hint-button');
        this.hintText = document.getElementById('hint-text');
        this.octaveSelect = document.getElementById('octave');
        this.noteButtons = document.querySelectorAll('.note-btn');
    }

    addEventListeners() {
        this.playButton.addEventListener('click', () => this.playRandomNote());
        this.difficultySelect.addEventListener('change', () => this.setupDifficulty());
        this.hintButton.addEventListener('click', () => this.provideHint());
        this.instrumentSelect.addEventListener('change', () => this.updateInstrumentSound());
        
        this.noteButtons.forEach(button => {
            button.addEventListener('click', () => this.checkNote(button.dataset.note));
        });
    }

    updateInstrumentSound() {
        // Stop any currently playing notes
        Object.values(this.instruments).forEach(synth => {
            synth.triggerRelease();
        });
    }

    setupDifficulty() {
        const difficulty = this.difficultySelect.value;
        switch(difficulty) {
            case 'beginner':
                this.octaveSelect.value = '4';
                this.octaveSelect.disabled = true;
                break;
            case 'intermediate':
                this.octaveSelect.disabled = false;
                break;
            case 'advanced':
                this.octaveSelect.disabled = false;
                break;
        }
    }

    async playRandomNote() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = this.octaveSelect.value;
        
        const randomIndex = Math.floor(Math.random() * notes.length);
        this.currentNote = `${notes[randomIndex]}${octave}`;
        
        await Tone.start();
        const currentInstrument = this.instruments[this.instrumentSelect.value];
        currentInstrument.triggerAttackRelease(this.currentNote, '1n');
        
        this.startTime = Date.now();
        this.hintsRemaining = 3;
        this.hintText.textContent = '';
        this.feedbackDisplay.textContent = 'Listen and guess the note!';
        
        this.noteButtons.forEach(button => {
            button.classList.remove('correct', 'incorrect');
        });
    }

    checkNote(guessedNote) {
        if (!this.currentNote) {
            this.feedbackDisplay.textContent = 'Click "Play Note" to start!';
            return;
        }

        const actualNote = this.currentNote.slice(0, -1); // Remove octave number
        const button = Array.from(this.noteButtons).find(btn => btn.dataset.note === guessedNote);
        const reactionTime = (Date.now() - this.startTime) / 1000;
        
        // Update progress stats
        this.progressStats.totalAttempts++;
        this.progressStats.reactionTimes.push(reactionTime);
        
        // Initialize note stats if not exists
        if (!this.progressStats.noteStats[actualNote]) {
            this.progressStats.noteStats[actualNote] = {
                attempts: 0,
                correct: 0,
                avgReactionTime: 0
            };
        }
        this.progressStats.noteStats[actualNote].attempts++;
        this.progressStats.noteStats[actualNote].avgReactionTime = 
            (this.progressStats.noteStats[actualNote].avgReactionTime * 
             (this.progressStats.noteStats[actualNote].attempts - 1) + reactionTime) / 
             this.progressStats.noteStats[actualNote].attempts;
        
        if (actualNote === guessedNote) {
            const timeBonus = Math.max(0, Math.floor(10 - reactionTime));
            const points = 10 + timeBonus;
            
            this.score += points;
            this.streak++;
            this.progressStats.correctAttempts++;
            this.progressStats.noteStats[actualNote].correct++;
            
            button.classList.add('correct');
            this.feedbackDisplay.textContent = `Correct! +${points} points (${timeBonus} time bonus)`;
        } else {
            this.streak = 0;
            button.classList.add('incorrect');
            
            // Track common mistakes
            const mistakeKey = `${actualNote}-${guessedNote}`;
            this.progressStats.commonMistakes[mistakeKey] = 
                (this.progressStats.commonMistakes[mistakeKey] || 0) + 1;
            
            this.feedbackDisplay.innerHTML = `
                <span style="color: var(--error-color)">Incorrect!</span> 
                The correct note was <span style="color: var(--primary-color)">${actualNote}</span>. 
                Listen again and try to hear the difference.
            `;
        }
        
        this.scoreDisplay.textContent = this.score;
        this.streakDisplay.textContent = this.streak;
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        const accuracyBars = document.getElementById('accuracy-bars');
        const reactionGraph = document.getElementById('reaction-graph');
        
        // Calculate overall accuracy
        const accuracy = this.progressStats.totalAttempts > 0 
            ? (this.progressStats.correctAttempts / this.progressStats.totalAttempts * 100).toFixed(1)
            : 0;
            
        // Calculate average reaction time
        const avgReactionTime = this.progressStats.reactionTimes.length > 0
            ? (this.progressStats.reactionTimes.reduce((a, b) => a + b) / 
               this.progressStats.reactionTimes.length).toFixed(2)
            : 0;

        // Find strongest and weakest notes
        let strongestNote = { note: null, accuracy: 0 };
        let weakestNote = { note: null, accuracy: 100 };
        
        Object.entries(this.progressStats.noteStats).forEach(([note, stats]) => {
            const noteAccuracy = (stats.correct / stats.attempts * 100);
            if (stats.attempts >= 3) { // Only consider notes with enough attempts
                if (noteAccuracy > strongestNote.accuracy) {
                    strongestNote = { note, accuracy: noteAccuracy };
                }
                if (noteAccuracy < weakestNote.accuracy) {
                    weakestNote = { note, accuracy: noteAccuracy };
                }
            }
        });

        // Find most common mistake
        let commonMistake = { pair: null, count: 0 };
        Object.entries(this.progressStats.commonMistakes).forEach(([pair, count]) => {
            if (count > commonMistake.count) {
                commonMistake = { pair, count };
            }
        });

        // Update the display
        accuracyBars.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Overall Accuracy</div>
                <div class="accuracy-bar" style="width: ${accuracy}%">${accuracy}%</div>
            </div>
            ${strongestNote.note ? `
                <div class="stat-item">
                    <div class="stat-label">Strongest Note: ${strongestNote.note}</div>
                    <div class="accuracy-bar" style="width: ${strongestNote.accuracy}%">
                        ${strongestNote.accuracy.toFixed(1)}%
                    </div>
                </div>
            ` : ''}
            ${weakestNote.note && weakestNote.note !== strongestNote.note ? `
                <div class="stat-item">
                    <div class="stat-label">Needs Practice: ${weakestNote.note}</div>
                    <div class="accuracy-bar" style="width: ${weakestNote.accuracy}%">
                        ${weakestNote.accuracy.toFixed(1)}%
                    </div>
                </div>
            ` : ''}
        `;

        reactionGraph.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Average Response Time</div>
                <div>${avgReactionTime}s</div>
            </div>
            ${commonMistake.pair && commonMistake.count > 1 ? `
                <div class="stat-item">
                    <div class="stat-label">Common Confusion</div>
                    <div>You often guess ${commonMistake.pair.split('-')[1]} 
                    when hearing ${commonMistake.pair.split('-')[0]}</div>
                </div>
            ` : ''}
        `;
    }

    provideHint() {
        if (!this.currentNote || this.hintsRemaining <= 0) {
            this.hintText.textContent = 'No hints available. Play a new note!';
            return;
        }

        const hints = [
            `This note is in octave ${this.currentNote.slice(-1)}`,
            `This note is ${this.currentNote[0]}${this.currentNote.length > 2 ? ' sharp' : ''}`,
            `The note you're looking for is ${this.currentNote.slice(0, -1)}`
        ];

        this.hintText.textContent = hints[3 - this.hintsRemaining];
        this.hintsRemaining--;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new PitchPerfect();
});
