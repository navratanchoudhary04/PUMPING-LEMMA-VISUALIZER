# Pumping Lemma Visualizer

<div align="center">

![Pumping Lemma Visualizer](https://img.shields.io/badge/Theory%20of%20Computation-Pumping%20Lemma-00d4ff?style=for-the-badge&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**An interactive, mathematically rigorous visualizer for proving languages are non-regular using the Pumping Lemma.**

🔗 **Live Demo:** [Open App](https://navratanchaudhary04.github.io/PUMPING-LEMMA-VISUALIZER/)
👉 https://navratanchaudhary04.github.io/PUMPING-LEMMA-VISUALIZER/


---

## 📖 What is the Pumping Lemma?

The Pumping Lemma is a fundamental theorem in formal language theory used to prove that certain languages are **not regular**. It states:

> For every regular language *L*, there exists a pumping length *p* ≥ 1 such that every string *s ∈ L* with |s| ≥ p can be partitioned as *s = xyz* where:
> 1. |*xy*| ≤ *p*
> 2. |*y*| ≥ 1
> 3. For all *i* ≥ 0, *xyⁱz ∈ L*

Proving a language is **non-regular** is done by showing that no matter how the adversary decomposes the string, we can always find an *i* that takes it out of the language — a **contradiction**.

---

## ✨ Features

### 🎓 Educational 5-Step Wizard
| Step | Description |
|------|-------------|
| **Setup** | Choose a non-regular language and set pumping length *p* |
| **Input** | Select a string *s ∈ L* with \|*s*\| ≥ *p* |
| **Partition** | Examine all valid decompositions *s = xyz* |
| **Pump** | Adjust *i* to find *xyⁱz ∉ L* (contradiction) |
| **Proof** | Auto-generated formal mathematical proof |

### 🌐 4 Preset Non-Regular Languages
- **aⁿbⁿ** — Equal a's followed by b's
- **wwᴿ** — Even-length palindromes
- **aⁿ²** — Perfect square length strings
- **aᵖ** — Prime length strings

### ✏️ Custom Language Editor
Define your own non-regular language with a **JavaScript validator function**:
```js
// Example: L = { aⁿbⁿcⁿ | n ≥ 1 }
const as = s.split('').filter(c => c === 'a').length;
const bs = s.split('').filter(c => c === 'b').length;
const cs = s.split('').filter(c => c === 'c').length;
return as === bs && bs === cs && as >= 1;
```

### 🎨 Premium UI/UX
- Dark mode with glassmorphism design
- Animated character tiles (x=gray, y=cyan pulsing, z=muted)
- Interactive sliding stepper with fill animation
- **Theory Panel** — step-specific explanations of the Pumping Lemma game
- **Auto-Solve Mode** — animated walkthrough of any language

### 📄 Proof Generation
- Full **KaTeX-rendered** LaTeX formal proof
- **Copy to Clipboard** button
- **Download as PDF** via print dialog
- **Session History** tracks all proofs in one session

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
git clone https://github.com/YOUR_USERNAME/pumping-lemma-visualizer.git
cd pumping-lemma-visualizer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── SetupStep.jsx          # Language selection (4 presets + custom)
│   ├── InputStep.jsx          # String input with live validation
│   ├── PartitionStep.jsx      # All xyz decompositions table
│   ├── PumpStep.jsx           # Interactive pump slider + contradiction tracker
│   ├── ProofStep.jsx          # Formal proof + copy/PDF export
│   ├── StringVisualizer.jsx   # Animated character tiles (x/y/z coloring)
│   ├── Stepper.jsx            # 5-step progress indicator
│   ├── TheoryPanel.jsx        # Collapsible theory drawer (floating ?)
│   ├── CustomLanguageEditor.jsx # JS validator editor with live testing
│   └── KaTeXBlock.jsx         # KaTeX math renderer
├── engine/
│   ├── validators.js          # 4 built-in language validators
│   ├── customLanguage.js      # Custom language factory (safe eval)
│   ├── splitter.js            # Pumping Lemma partition generator
│   └── proofGenerator.js      # Formal proof narrative builder
├── App.jsx                    # Main orchestrator + state management
└── index.css                  # Global styles + CSS variables + animations
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Animations & transitions |
| KaTeX | LaTeX math rendering |

---

## 📐 Mathematical Correctness

- All 4 preset validators are **mathematically rigorous**
- Partition generator correctly enforces |*xy*| ≤ *p* and |*y*| ≥ 1
- Custom language validator runs inside `try/catch` with `new Function()` for safe execution
- Proof narrative is formally structured with Assumption → Application → Selection → Decomposition → Pumping → Contradiction

---

## 🏫 Academic Use

This project was developed as a **BTech Final Year Project** for the *Theory of Computation* course. It is intended to help students:

1. Visualize the game-theoretic nature of the Pumping Lemma proof
2. Understand why *every* valid decomposition must be contradicted
3. Generate publication-ready formal proofs

---

## 📜 License

MIT License — free to use for educational purposes.

---

<div align="center">
Made with ❤️ for Theory of Computation students
</div>
