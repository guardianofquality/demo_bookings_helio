// Generate a UUID (uses crypto.randomUUID if available)
function generateUUID() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxxyxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Set today's date as default and minimum (no past dates)
function setDateToToday(dateInput) {
  const today = new Date();
  const yyyyMmDd = today.toISOString().split("T")[0];
  dateInput.min = yyyyMmDd;
  dateInput.value = yyyyMmDd;
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

  // AUTO BMI CALCULATION
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

  // Handle submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log("Form submitted:", data);

    const displayName = data.name || "Unknown";
    const displayDate = data.date || "";
    const displayBMI = data.bmi || "N/A";

    // Show booking confirmation message
    successMessage.textContent =
      `Booking Done for ${displayName} on ${displayDate}. BMI: ${displayBMI}`;
    successMessage.style.display = "block";

    // Reset the form but keep UUID and date fresh
    form.reset();
    initFormMeta();
  });
});
