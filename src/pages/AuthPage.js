const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const messageBox = document.getElementById('message-box');

// Sliding Animation Listeners
signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

// Mobile Toggle Function
function toggleMobile() {
    if (container.classList.contains("right-panel-active")) {
        container.classList.remove("right-panel-active");
    } else {
        container.classList.add("right-panel-active");
    }
}

// Form Handling Demo
function handleForm(event, msg) {
    event.preventDefault(); // Prevent page refresh
    const form = event.target;
    const btn = form.querySelector('.btn');
    const originalText = btn.innerText;
    
    // Loading state spinner
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    
    // Simulate API call
    setTimeout(() => {
        btn.innerText = originalText;
        showMessage(msg);
        // form.reset(); // Optional: reset form fields
    }, 1500);
}

// Intercept specific forms
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');

if(signinForm) {
    signinForm.addEventListener('submit', (e) => handleForm(e, '로그인 성공! 환승마켓에 오신 것을 환영합니다.'));
}
if(signupForm) {
    signupForm.addEventListener('submit', (e) => handleForm(e, '회원가입 완료! 환승마켓의 가족이 되셨습니다.'));
}

function showMessage(text) {
    messageBox.innerText = text;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// Auto-advance to the next input field on Enter key press
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = Array.from(form.querySelectorAll('input:not([type="radio"])'));
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    // Prevent submission until the very last field
                    if (index < inputs.length - 1) {
                        e.preventDefault(); 
                        inputs[index + 1].focus();
                    }
                }
            });
        });
    });
});
