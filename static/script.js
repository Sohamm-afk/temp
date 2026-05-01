// ============================================
// Ride Sharing Matcher - Frontend JavaScript
// ============================================

// ---------- Toast Notification ----------
// Shows a temporary notification at the bottom-right
function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';

    // Auto-hide after 2.5 seconds
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
        toast.className = 'toast';
    }, 2500);
}

// ---------- Update Rider Count ----------
function updateCount(count) {
    var el = document.getElementById('rider-count-num');
    el.textContent = count;
    // Quick scale animation
    el.style.transform = 'scale(1.4)';
    setTimeout(function() {
        el.style.transition = '0.3s ease';
        el.style.transform = 'scale(1)';
    }, 150);
}

// ---------- Highlight Output ----------
function flashOutput() {
    var output = document.getElementById('output');
    output.classList.add('highlight');
    setTimeout(function() {
        output.classList.remove('highlight');
    }, 800);
}

// ---------- Typewriter Effect ----------
// Displays text character-by-character for a premium feel
function typewrite(element, text, speed, callback) {
    element.textContent = '';
    var i = 0;
    function step() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(step, speed);
        } else if (callback) {
            callback();
        }
    }
    step();
}

// ---------- addRider() ----------
// Reads form inputs, sends a POST request to /add,
// and displays the updated rider list.
function addRider() {
    var name = document.getElementById('rider-name').value;
    var start = document.getElementById('start-loc').value;
    var end = document.getElementById('end-loc').value;

    // Basic validation
    if (!name) {
        showToast('Please enter a rider name.', 'error');
        return;
    }
    if (start === end) {
        showToast('Start and end must be different.', 'error');
        return;
    }

    // Disable button while processing
    var btn = document.getElementById('btn-add');
    btn.disabled = true;
    btn.style.opacity = '0.6';

    // Send POST request to /add
    fetch('/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, start: start, end: end })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        btn.disabled = false;
        btn.style.opacity = '1';

        if (data.error) {
            showToast(data.error, 'error');
            return;
        }

        // Display the current list of riders
        var output = 'Riders Added:\n';
        output += '─────────────\n';
        for (var i = 0; i < data.riders.length; i++) {
            var r = data.riders[i];
            output += '  ' + (i + 1) + '.  ' + r.name + '  (' + r.start + ' → ' + r.end + ')\n';
        }

        // Typewriter effect for output
        typewrite(document.getElementById('output'), output, 8);
        flashOutput();

        // Update count
        updateCount(data.riders.length);

        // Show toast
        showToast('✓ ' + name + ' added successfully', 'success');

        // Clear the name input
        document.getElementById('rider-name').value = '';
        document.getElementById('rider-name').focus();
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.style.opacity = '1';
        showToast('Error: ' + err.message, 'error');
    });
}


// ---------- matchRiders() ----------
// Sends a GET request to /match,
// and displays riders + matching results.
function matchRiders() {
    // Pulse animation on button
    var btn = document.getElementById('btn-match');
    btn.classList.add('pulse');
    setTimeout(function() { btn.classList.remove('pulse'); }, 600);

    fetch('/match')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        var output = '';

        // Show all riders
        output += 'All Riders:\n';
        output += '───────────\n';
        if (data.riders.length === 0) {
            output += '  (none)\n';
        } else {
            for (var i = 0; i < data.riders.length; i++) {
                var r = data.riders[i];
                output += '  ' + (i + 1) + '.  ' + r.name + '  (' + r.start + ' → ' + r.end + ')\n';
            }
        }

        output += '\n';

        // Show matches
        output += 'Matches (Greedy):\n';
        output += '─────────────────\n';
        for (var j = 0; j < data.matches.length; j++) {
            output += '  ● ' + data.matches[j] + '\n';
        }

        // Typewriter effect
        typewrite(document.getElementById('output'), output, 6);
        flashOutput();

        showToast('⚡ Matching complete', 'info');
    })
    .catch(function(err) {
        showToast('Error: ' + err.message, 'error');
    });
}

// ---------- Enter key support ----------
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('rider-name').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            addRider();
        }
    });
});
