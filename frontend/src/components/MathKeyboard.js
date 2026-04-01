import React from 'react';

const MathKeyboard = ({ onKeyPress, onBackspace, onClear, onEnter }) => {
  const k = (key) => () => onKeyPress?.(key);
  const rows = [
    { keys: [['7'],['8'],['9'],['+','operator'],['-','operator']] },
    { keys: [['4'],['5'],['6'],['×','operator'],['÷','operator']] },
    { keys: [['1'],['2'],['3'],['=','operator'],['≠','operator']] },
    { keys: [['0'],['.'],['±','operator'],['∓','operator'],['≈','operator']] },
    { keys: [['<','operator'],['>','operator'],['≤','operator'],['≥','operator'],['≪','operator']] },
    { keys: [['≫','operator'],['∝','operator'],['∼','operator'],['∽','operator'],['≅','operator']] },
    { keys: [['≃','operator'],['≡','operator'],['≢','operator'],['∧','operator'],['∨','operator']] },
    { keys: [['¬','operator'],['→','operator'],['↔','operator'],['∀','operator'],['∃','operator']] },
    { keys: [['∈','operator'],['∉','operator'],['⊂','operator'],['⊃','operator'],['⊆','operator']] },
    { keys: [['⊇','operator'],['∪','operator'],['∩','operator'],['∫','operator'],['∬','operator']] },
    { keys: [['∭','operator'],['∮','operator'],['∯','operator'],['∰','operator'],['∂','operator']] },
    { keys: [['∇','operator'],['∆','operator'],['δ','operator'],['ε','operator'],['lim','operator']] },
    { keys: [['∑','operator'],['∏','operator'],['∐','operator'],['∞','operator'],['∟','operator']] },
    { keys: [['∠','operator'],['∢','operator'],['°','operator'],['′','operator'],['″','operator']] },
    { keys: [['∥','operator'],['∦','operator'],['⊥','operator'],['∵','operator'],['∴','operator']] },
    { keys: [['△','operator'],['□','operator'],['◯','operator'],['◊','operator'],['♢','operator']] },
    { keys: [['Α','math-symbol'],['α','math-symbol'],['Β','math-symbol'],['β','math-symbol'],['Γ','math-symbol']] },
    { keys: [['γ','math-symbol'],['Δ','math-symbol'],['δ','math-symbol'],['Ε','math-symbol'],['ε','math-symbol']] },
    { keys: [['Ζ','math-symbol'],['ζ','math-symbol'],['Η','math-symbol'],['η','math-symbol'],['Θ','math-symbol']] },
    { keys: [['θ','math-symbol'],['Ι','math-symbol'],['ι','math-symbol'],['Κ','math-symbol'],['κ','math-symbol']] },
    { keys: [['Λ','math-symbol'],['λ','math-symbol'],['Μ','math-symbol'],['μ','math-symbol'],['Ν','math-symbol']] },
    { keys: [['ν','math-symbol'],['Ξ','math-symbol'],['ξ','math-symbol'],['Ο','math-symbol'],['ο','math-symbol']] },
    { keys: [['Π','math-symbol'],['π','math-symbol'],['Ρ','math-symbol'],['ρ','math-symbol'],['Σ','math-symbol']] },
    { keys: [['σ','math-symbol'],['ς','math-symbol'],['Τ','math-symbol'],['τ','math-symbol'],['Υ','math-symbol']] },
    { keys: [['υ','math-symbol'],['Φ','math-symbol'],['φ','math-symbol'],['Χ','math-symbol'],['χ','math-symbol']] },
    { keys: [['Ψ','math-symbol'],['ψ','math-symbol'],['Ω','math-symbol'],['ω','math-symbol'],['%','operator']] },
    { keys: [['‰','operator'],['√','operator'],['∛','operator'],['∜','operator'],['!','operator']] },
    { keys: [['mod','operator'],['·','operator'],['∗','operator'],['∘','operator'],['×','operator']] },
    { keys: [['Å','math-symbol'],['μm','math-symbol'],['nm','math-symbol'],['mm','math-symbol'],['cm','math-symbol']] },
    { keys: [['m','math-symbol'],['km','math-symbol'],['mg','math-symbol'],['g','math-symbol'],['kg','math-symbol']] },
    { keys: [['mL','math-symbol'],['L','math-symbol'],['Hz','math-symbol'],['kHz','math-symbol'],['MHz','math-symbol']] },
    { keys: [['GHz','math-symbol'],['m/s','math-symbol'],['m/s²','math-symbol'],['m³','math-symbol'],['Pa','math-symbol']] },
    { keys: [['J','math-symbol'],['W','math-symbol'],['N','math-symbol'],['C','math-symbol'],['V','math-symbol']] },
    { keys: [['Ω','math-symbol'],['F','math-symbol'],['H','math-symbol'],['·','operator'],['×','operator']] },
    { keys: [['[','operator'],[']','operator'],['{','operator'],['}','operator'],['|','operator']] },
    { keys: [['‖','operator'],['⟦','operator'],['⟧','operator'],['î','operator'],['ĵ','operator']] },
    { keys: [['k̂','operator'],['→','operator'],['←','operator'],['↑','operator'],['↓','operator']] },
    { keys: [['↔','operator'],['↕','operator'],['↖','operator'],['↗','operator'],['↘','operator']] },
    { keys: [['↙','operator'],['⇒','operator'],['⇐','operator'],['⇑','operator'],['⇓','operator']] },
    { keys: [['⇔','operator'],['⇄','operator'],['⇆','operator'],['➡','operator'],['⬅','operator']] },
    { keys: [['$','math-symbol'],['€','math-symbol'],['£','math-symbol'],['¥','math-symbol'],['₹','math-symbol']] },
    { keys: [['ℕ','math-symbol'],['ℤ','math-symbol'],['ℚ','math-symbol'],['ℝ','math-symbol'],['ℂ','math-symbol']] },
    { keys: [['⅐','math-symbol'],['⅑','math-symbol'],['⅒','math-symbol'],['⅓','math-symbol'],['⅔','math-symbol']] },
    { keys: [['⅕','math-symbol'],['⅖','math-symbol'],['⅗','math-symbol'],['⅘','math-symbol'],['⅙','math-symbol']] },
    { keys: [['⅚','math-symbol'],['⅛','math-symbol'],['⅜','math-symbol'],['⅝','math-symbol'],['⅞','math-symbol']] },
    { keys: [['P','math-symbol'],['E','math-symbol'],['Var','math-symbol'],['σ','math-symbol'],['μ','math-symbol']] },
  ];

  return (
    <div className="math-keyboard" data-testid="math-keyboard">
      {rows.map((row, i) => (
        <div className="keyboard-row" key={i}>
          {row.keys.map(([label, cls], j) => (
            <button key={j} className={`keyboard-key ${cls || ''}`} onClick={k(label)}>{label}</button>
          ))}
        </div>
      ))}
      <div className="keyboard-row">
        <button className="keyboard-key action" onClick={onClear}>Clear</button>
        <button className="keyboard-key action" onClick={onBackspace}>&#9003;</button>
        <button className="keyboard-key action" onClick={k(' ')}>Space</button>
        <button className="keyboard-key action" onClick={onEnter}>Enter</button>
      </div>
    </div>
  );
};

export default MathKeyboard;
