
// HTML elemanlarını seçiyoruz.
const form = document.getElementById("grade-form");

const midtermInput = document.getElementById("midterm");
const courseworkInput = document.getElementById("coursework");
const finalInput = document.getElementById("final-exam");
const makeupInput = document.getElementById("makeup");

const absentInput = document.getElementById("absent");
const attendedInput = document.getElementById("attended");

const errorMessage = document.getElementById("error-message");
const resultCard = document.getElementById("result-card");

const successScore = document.getElementById("success-score");
const letterGrade = document.getElementById("letter-grade");
const gradeCoefficient = document.getElementById("grade-coefficient");
const usedExam = document.getElementById("used-exam");
const resultExplanation = document.getElementById("result-explanation");
const resultStatus = document.getElementById("result-status");

// Sayıyı en fazla iki ondalıkla gösteriyoruz.
function formatNumber(number) {
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
}

// Not alanlarının boş veya hatalı olup olmadığını kontrol ediyoruz.
function readGrade(input, label, required = true) {
    const value = input.value.trim();

    if (value === "") {
        if (required) {
            throw new Error(label + " gerekli. Lütfen bu alanı doldur.");
        }

        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0 || number > 100) {
        throw new Error(label + " 0 ile 100 arasında olmalıdır.");
    }

    return number;
}

// Sonucu ekranda gösteriyoruz.
function showResult(score, letter, coefficient, status, explanation, examName) {
    resultCard.hidden = false;

    resultCard.classList.toggle("passed", status === "Geçti");
    resultCard.classList.toggle("failed", status === "Kaldı");

    if (score === null) {
        successScore.textContent = "—";
    } else {
        successScore.textContent = formatNumber(score);
    }

    letterGrade.textContent = letter;
    gradeCoefficient.textContent = coefficient;
    resultStatus.textContent = status;
    usedExam.textContent = examName;
    resultExplanation.textContent = explanation;
}

// Hata mesajını gösteriyoruz.
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    resultCard.hidden = true;
}

// Hesapla butonuna basıldığında çalışır.
form.addEventListener("submit", function (event) {
    event.preventDefault();

    errorMessage.hidden = true;
    errorMessage.textContent = "";

    try {
        // Devamsızlık varsa F1.
        if (absentInput.checked) {
            showResult(
                null,
                "F1",
                "0.00",
                "Kaldı",
                "Devamsız olduğun için F1 verildi.",
                "Uygulanmaz"
            );

            return;
        }

        // Sınava girilmediyse F2.
        if (attendedInput.value === "no") {
            showResult(
                null,
                "F2",
                "0.00",
                "Kaldı",
                "Genel veya bütünleme sınavına girmediğin için F2 verildi.",
                "Sınava girilmedi"
            );

            return;
        }

        // Vize notunu alıyoruz.
        const midterm = readGrade(
            midtermInput,
            "Vize / ara sınav notu"
        );

        // Çalışma puanı boşsa vize notunu kullanıyoruz.
        const coursework = readGrade(
            courseworkInput,
            "Yıl içi çalışma puanı",
            false
        );

        let yearGrade;

        if (coursework === null) {
            yearGrade = midterm;
        } else {
            yearGrade = coursework;
        }

        // Bütünleme girildiyse bütünleme kullanılır.
        const makeup = readGrade(
            makeupInput,
            "Bütünleme notu",
            false
        );

        let exam;
        let examName;

        if (makeup !== null) {
            exam = makeup;
            examName = "Bütünleme";
        } else {
            exam = readGrade(
                finalInput,
                "Final notu"
            );

            examName = "Final";
        }

        // Başarı notu hesaplanıyor.
        const rawScore = (yearGrade * 0.40) + (exam * 0.60);

        const score = Math.round(
            (rawScore + Number.EPSILON) * 100
        ) / 100;

        // Sınav notu 50'nin altındaysa F3.
        if (exam < 50) {
            showResult(
                score,
                "F3",
                "0.00",
                "Kaldı",
                examName + " notun " + formatNumber(exam) +
                " olduğu için 50'nin altında kaldı. F3 verildi.",
                examName
            );

            return;
        }

        // Başarı notu 60'ın altındaysa F3.
        if (score < 60) {
            showResult(
                score,
                "F3",
                "0.00",
                "Kaldı",
                "Başarı notun " + formatNumber(score) +
                " olduğu için 60'ın altında kaldı. F3 verildi.",
                examName
            );

            return;
        }

        // Harf notunu belirliyoruz.
        let letter;
        let coefficient;

        if (score >= 90) {
            letter = "A1";
            coefficient = "4.00";
        } else if (score >= 80) {
            letter = "A2";
            coefficient = "3.50";
        } else if (score >= 70) {
            letter = "B1";
            coefficient = "3.00";
        } else if (score >= 65) {
            letter = "B2";
            coefficient = "2.75";
        } else {
            letter = "C";
            coefficient = "2.50";
        }

        // Başarılı sonucu gösteriyoruz.
        showResult(
            score,
            letter,
            coefficient,
            "Geçti",
            "Sınav notun en az 50 ve başarı notun en az 60. " +
            "Geçme koşullarını sağladın.",
            examName
        );

    } catch (error) {
        showError(error.message);
    }
});

// Bütünleme girilince final alanını kapatıyoruz.
function updateExamFields() {
    const makeupEntered = makeupInput.value.trim() !== "";

    finalInput.disabled = makeupEntered;
    finalInput.required = !makeupEntered;
}

makeupInput.addEventListener("input", updateExamFields);

// Sıfırla butonuna basıldığında sonuçları ve uyarıları temizliyoruz.
form.addEventListener("reset", function () {
    setTimeout(function () {
        errorMessage.hidden = true;
        errorMessage.textContent = "";

        resultCard.hidden = true;
        resultCard.classList.remove("passed", "failed");

        updateExamFields();
    }, 0);
});

// Sayfa ilk açıldığında alanların durumunu ayarlıyoruz.
updateExamFields();
