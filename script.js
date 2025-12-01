// ---- Utility functions ----

// Generate a UUID (uses crypto.randomUUID if available)
function generateUUID() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  // Fallback simple UUID-like generator
  return "xxxxxxxxyxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Set today's date as default and minimum (no past dates)
function setDateToToday(dateInput) {
  const today = new Date();
  const yyyyMmDd = today.toISOString().split("T")[0]; // "YYYY-MM-DD"
  dateInput.min = yyyyMmDd;
  dateInput.value = yyyyMmDd;
}

// Simple HTML escaping for safety
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("campForm");
  const slNoInput = document.getElementById("slNo");
  const dateInput = document.getElementById("date");
  const successMessage = document.getElementById("successMessage");
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const bmiInput = document.getElementById("bmi");

  // Initialize SL No + Date
  function initFormMeta() {
    slNoInput.value = generateUUID();
    setDateToToday(dateInput);
  }
  initFormMeta();

  // ---- Auto BMI calculation ----
  function calculateBMI() {
    const weight = parseFloat(weightInput.value);
    const heightCm = parseFloat(heightInput.value);

    if (!weight || !heightCm || heightCm === 0) {
      bmiInput.value = "";
      return;
    }

    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    bmiInput.value = bmi.toFixed(1);
  }

  weightInput.addEventListener("input", calculateBMI);
  heightInput.addEventListener("input", calculateBMI);

  // ---- Health evaluation helpers ----

  function evaluateBMI(bmi) {
    if (isNaN(bmi)) return null;
    if (bmi < 18.5) {
      return {
        status: "low",
        statusText: "Underweight",
        note: "Below the usual healthy range (18.5–24.9)."
      };
    } else if (bmi < 25) {
      return {
        status: "normal",
        statusText: "Normal",
        note: "Within the usual healthy BMI range (18.5–24.9)."
      };
    } else if (bmi < 30) {
      return {
        status: "borderline",
        statusText: "Overweight",
        note: "Above the usual healthy range. Consider lifestyle changes."
      };
    } else {
      return {
        status: "high",
        statusText: "Obese",
        note: "Significantly above the usual healthy range. Medical advice is recommended."
      };
    }
  }

  function evaluateSpO2(spo2) {
    if (isNaN(spo2)) return null;
    if (spo2 >= 95) {
      return {
        status: "normal",
        statusText: "Normal",
        note: "Usual oxygen saturation is 95–100%."
      };
    } else if (spo2 >= 92) {
      return {
        status: "borderline",
        statusText: "Borderline",
        note: "Slightly low. Monitor and consult a doctor if symptoms are present."
      };
    } else {
      return {
        status: "low",
        statusText: "Low",
        note: "Below usual range. Please consult a doctor promptly."
      };
    }
  }

  function evaluateBP(bpStr) {
    if (!bpStr) return null;
    const parts = bpStr.split("/");
    if (parts.length !== 2) return null;
    const sys = parseInt(parts[0].trim(), 10);
    const dia = parseInt(parts[1].trim(), 10);
    if (isNaN(sys) || isNaN(dia)) return null;

    // Simple classification (general guideline)
    if (sys < 90 || dia < 60) {
      return {
        status: "low",
        statusText: "Low",
        note: "Below usual range. May need medical review, especially if symptomatic."
      };
    } else if (sys <= 120 && dia <= 80) {
      return {
        status: "normal",
        statusText: "Normal",
        note: "Close to usual reference value 120/80 mmHg."
      };
    } else if (sys <= 139 || dia <= 89) {
      return {
        status: "borderline",
        statusText: "Pre-hypertensive",
        note: "Above ideal. Regular monitoring and lifestyle care advised."
      };
    } else {
      return {
        status: "high",
        statusText: "High",
        note: "Raised blood pressure. Please discuss with your doctor."
      };
    }
  }

  function evaluateSugar(sugar) {
    if (isNaN(sugar)) return null;
    // Approx generic range for random/unknown context
    if (sugar < 70) {
      return {
        status: "low",
        statusText: "Low",
        note: "Below 70 mg/dL. This is lower than usual and may need urgent attention if symptomatic."
      };
    } else if (sugar <= 140) {
      return {
        status: "normal",
        statusText: "Normal",
        note: "Within typical range (about 70–140 mg/dL depending on fasting/meal timing)."
      };
    } else if (sugar <= 199) {
      return {
        status: "borderline",
        statusText: "Borderline High",
        note: "Above usual target. Further testing and medical advice are recommended."
      };
    } else {
      return {
        status: "high",
        statusText: "High",
        note: "Significantly above usual targets. Please consult your doctor."
      };
    }
  }

  function evaluatePPBS(ppbs) {
    if (isNaN(ppbs)) return null;
    // Reference: ~110–150 mg/dL
    if (ppbs < 110) {
      return {
        status: "low",
        statusText: "Low",
        note: "Below typical PPBS reference (110–150 mg/dL). Interpret with clinical context."
      };
    } else if (ppbs <= 150) {
      return {
        status: "normal",
        statusText: "Normal",
        note: "Within the usual PPBS range (110–150 mg/dL)."
      };
    } else if (ppbs <= 199) {
      return {
        status: "borderline",
        statusText: "Borderline High",
        note: "Above usual range. Follow-up with your doctor is advisable."
      };
    } else {
      return {
        status: "high",
        statusText: "High",
        note: "Significantly above usual PPBS targets. Please consult your doctor."
      };
    }
  }

  function evaluateHB(hb, gender) {
    if (isNaN(hb)) return null;

    // Simple Indian-style reference:
    // Male: 13–17 g/dL, Female: 12–15 g/dL, otherwise 12–16 as generic
    let low, high;
    const g = (gender || "").toLowerCase();
    if (g === "male") {
      low = 13;
      high = 17;
    } else if (g === "female") {
      low = 12;
      high = 15;
    } else {
      low = 12;
      high = 16;
    }

    if (hb < low) {
      return {
        status: "low",
        statusText: "Low",
        note: `Below usual range (${low}–${high} g/dL). May suggest anaemia; please consult a doctor.`
      };
    } else if (hb > high) {
      return {
        status: "high",
        statusText: "High",
        note: `Above usual range (${low}–${high} g/dL). Needs clinical correlation.`
      };
    } else {
      return {
        status: "normal",
        statusText: "Normal",
        note: `Within usual range (${low}–${high} g/dL).`
      };
    }
  }

  // ---- Handle submission ----
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log("Form submitted:", data);

    const displayName = escapeHtml(data.name || "Unknown");
    const displayDate = data.date || "";
    const displaySL = escapeHtml(data.slNo || "");

    const metrics = [];
    let hasIssues = false;

    // BMI
    const bmiVal = parseFloat(data.bmi);
    const bmiEval = evaluateBMI(bmiVal);
    if (bmiEval) {
      metrics.push({
        label: "BMI",
        value: isNaN(bmiVal) ? "N/A" : bmiVal.toFixed(1),
        unit: "",
        ...bmiEval
      });
      if (bmiEval.status !== "normal") hasIssues = true;
    }

    // SpO2
    const spo2Val = parseFloat(data.spo2);
    const spo2Eval = evaluateSpO2(spo2Val);
    if (spo2Eval) {
      metrics.push({
        label: "SpO₂",
        value: isNaN(spo2Val) ? "N/A" : spo2Val.toString(),
        unit: "%",
        ...spo2Eval
      });
      if (spo2Eval.status === "low" || spo2Eval.status === "borderline") hasIssues = true;
    }

    // Blood Pressure
    const bpEval = evaluateBP(data.bp);
    if (bpEval) {
      metrics.push({
        label: "Blood Pressure",
        value: data.bp,
        unit: "mmHg",
        ...bpEval
      });
      if (bpEval.status !== "normal") hasIssues = true;
    }

    // Random/Fasting Blood Sugar (approx)
    const sugarVal = parseFloat(data.bloodSugar);
    const sugarEval = evaluateSugar(sugarVal);
    if (sugarEval) {
      metrics.push({
        label: "Blood Sugar",
        value: isNaN(sugarVal) ? "N/A" : sugarVal.toString(),
        unit: "mg/dL",
        ...sugarEval
      });
      if (sugarEval.status !== "normal") hasIssues = true;
    }

    // PPBS
    const ppbsVal = parseFloat(data.ppbs);
    const ppbsEval = evaluatePPBS(ppbsVal);
    if (ppbsEval) {
      metrics.push({
        label: "PPBS (2 hrs)",
        value: isNaN(ppbsVal) ? "N/A" : ppbsVal.toString(),
        unit: "mg/dL",
        ...ppbsEval
      });
      if (ppbsEval.status !== "normal") hasIssues = true;
    }

    // Hemoglobin
    const hbVal = parseFloat(data.hb);
    const hbEval = evaluateHB(hbVal, data.gender);
    if (hbEval) {
      metrics.push({
        label: "Hemoglobin",
        value: isNaN(hbVal) ? "N/A" : hbVal.toString(),
        unit: "g/dL",
        ...hbEval
      });
      if (hbEval.status !== "normal") hasIssues = true;
    }

    // Build summary UI (only AFTER submit)
    let summaryHtml = `
      <h3>Booking Done</h3>
      <p>
        <strong>Name:</strong> ${displayName}<br/>
        <strong>Date:</strong> ${displayDate}<br/>
        <strong>SL. No.:</strong> ${displaySL}
      </p>
    `;

    if (metrics.length > 0) {
      summaryHtml += `<div class="summary-grid">`;
      summaryHtml += metrics
        .map(
          (m) => `
        <div class="summary-item">
          <div class="summary-label">${m.label}</div>
          <div class="summary-value">${m.value} ${m.unit || ""}</div>
          <span class="badge badge-${m.status}">${m.statusText}</span>
          <div class="summary-note">${m.note}</div>
        </div>
      `
        )
        .join("");
      summaryHtml += `</div>`;
    }

    if (hasIssues) {
      summaryHtml += `
        <div class="summary-warning">
          Some of your readings are outside the usual reference ranges.
          Please <strong>consult with a doctor</strong> and share this information for proper medical advice.
        </div>
      `;
    } else {
      summaryHtml += `
        <div class="summary-ok">
          Your key readings appear within the usual reference ranges.
          This is only an approximate guide – regular check-ups with your doctor are still important.
        </div>
      `;
    }

    successMessage.innerHTML = summaryHtml;
    successMessage.style.display = "block";

    // Reset the form for next patient, but keep the summary visible
    form.reset();
    initFormMeta();
  });
});
