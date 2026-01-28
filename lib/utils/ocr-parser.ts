export function extractDataFromOCR(text: string) {
    console.log("--- Parser V5 (Strict Name + Fuzzy Extras) Start ---")

    // 1. Clean up the text: Filter blank lines
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2);

    // 2. Keywords to ignore for NAME candidates
    const ignoreKeywords = [
        'REPUBLIC', 'REPUBLIKA', 'PHILIPPINES', 'PILIPINAS',
        'LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'GIVEN NAME', 'SURNAME',
        'ADDRESS', 'DATE OF BIRTH', 'NATIONALITY', 'SEX', 'GENDER',
        'ID NO', 'NO.', 'NUMBER', 'SIGNATURE', 'EXPIRATION', 'VALID UNTIL',
        'DRIVER', 'LICENSE', 'AGENCY', 'DEPARTMENT', 'BUREAU', 'CITY',
        'POSTAL', 'IDENTITY', 'CARD', 'CORPORATION', 'AKA', 'TITAN', 'TITANS'
    ];

    // Helper to clean a line of common OCR noise at start/end
    const cleanLine = (raw: string) => {
        // Keep spaces, delimeters, and alphanumeric
        return raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    }

    // Helper: Fuzzy Date Parser
    // Tries to find "NOV 28 1990" even if it looks like "NOV £80" or "NOV 28 l99O"
    const fuzzyParseDate = (line: string): string | null => {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const upper = line.toUpperCase();

        const foundMonth = months.find(m => upper.includes(m));
        if (!foundMonth) return null;

        // Clean the line relative to digits: define common subs
        // Replace non-alphanumeric (except space) with empty
        // Try to normalize digits
        let normalized = upper.replace(/[lI|]/g, '1').replace(/[O]/g, '0').replace(/[S]/g, '5').replace(/[£]/g, '8');

        // Look for Year: 19xx or 20xx
        const yearMatch = normalized.match(/(?:19|20)\d{2}/);
        if (yearMatch) {
            return `${foundMonth} ${yearMatch[0]}`;
        }

        // Look for short year (e.g. '04 for 2004 or 1904) - risky but user asked for "22 Jun 04"
        // Match "DD Mon YY" pattern
        const shortYearMatch = normalized.match(/\d{1,2}\s+[A-Z]{3}\s+(\d{2})/);
        if (shortYearMatch) {
            return `${foundMonth} ${shortYearMatch[1]}`;
        }

        return null;
    }


    // --- EXTRACTION LOGIC ---

    let nameCandidate = "";
    let nameScore = 0;
    let nameLineIndex = -1;

    let addressCandidate = "";
    let dobCandidate = "";

    // Strict Regex Patterns
    // Added \d{2} [A-Z]{3} \d{2} for "22 Jun 04" support
    const datePattern = /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(?:\d{2,4}[-/]\d{1,2}[-/]\d{1,2})|(?:(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-z]*[\s,.]+\d{1,2}[\s,.]+\d{2,4})|(?:\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})\b/i;

    // Address Keywords
    const addressKeywords = ['ST', 'STREET', 'AVE', 'AVENUE', 'RD', 'ROAD', 'BRGY', 'BARANGAY', 'SUBD', 'SUBDIVISION', 'CITY', 'PROVINCE', 'MANILA', 'QUEZON'];

    // First Pass: Identify Name and Strong Date/Address
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = cleanLine(rawLine);
        if (!line) continue;
        const upperLine = line.toUpperCase();

        // 1. Check for DOB (Strict)
        if (!dobCandidate) {
            const dateMatch = line.match(datePattern);
            const isExpiration = /EXP|VALID|ISSUE/i.test(line);
            if (dateMatch && !isExpiration) {
                console.log(`DOB (Strict) found: ${dateMatch[0]}`);
                dobCandidate = dateMatch[0];
                continue;
            }

            // Fuzzy DOB Check
            const fuzzy = fuzzyParseDate(line);
            if (fuzzy && !isExpiration) {
                console.log(`DOB (Fuzzy) found: ${fuzzy} in line: ${line}`);
                dobCandidate = fuzzy;
                continue;
            }
        }

        // 2. Check for Address (Strict Keywords)
        if (!addressCandidate) {
            const hasAddressKeyword = addressKeywords.some(k => upperLine.includes(` ${k} `) || upperLine.endsWith(` ${k}`));
            if (hasAddressKeyword && line.length > 10) {
                console.log(`Address (Keyword) found: ${line}`);
                addressCandidate = line;
                continue;
            }
        }

        // 3. Name Candidate Detection (High Strictness Restored)
        if (datePattern.test(line)) continue;

        // STRICTER logic for Name (V2/V3 style)
        const isLikelyName = (str: string) => {
            if (str.length < 4) return false; // Minimum length
            const upper = str.toUpperCase();

            // Instant reject specific junk chars often in noise
            if (/[£$%=;]/.test(str)) return false;
            if (/[0-9]/.test(str)) return false; // No numbers in name

            // Reject keywords
            if (ignoreKeywords.some(keyword => upper.includes(keyword))) return false;

            const words = str.split(/\s+/).filter(w => w.length > 1); // Only count "real" words
            if (words.length < 2) return false; // At least 2 words (e.g. JARED KARL)

            // Uppercase dominance check
            const upperCount = str.replace(/[^A-Z]/g, "").length;
            const letterCount = str.replace(/[^a-zA-Z]/g, "").length;

            if (letterCount === 0) return true; // All symbols/spaces? unsafe
            if ((upperCount / letterCount) < 0.8) return false; // Must be >80% uppercase

            return true;
        };

        if (isLikelyName(line)) {
            let score = 0;
            const words = line.split(/\s+/);
            const isAllCaps = line === upperLine;

            score += words.length * 2;
            if (line.length > 10) score += 2;
            if (isAllCaps) score += 10; // HUGE bonus for all caps (ID standard)
            if (words.length >= 3) score += 3;

            // Penalize weird punctuation inside name
            if (/[.,]/.test(line)) score -= 5;

            console.log(`Scoring Name '${line}': ${score}`);

            if (score > nameScore) {
                nameScore = score;
                nameCandidate = line;
                nameLineIndex = i;
            }
        }
    }

    // Second Pass: Positional Address (If no keyword address found)
    // Look 1-3 lines AFTER the name
    if (!addressCandidate && nameLineIndex !== -1) {
        console.log("Attempting Positional Address Search...");
        for (let i = 1; i <= 3; i++) {
            const targetIndex = nameLineIndex + i;
            if (targetIndex >= lines.length) break;

            const raw = lines[targetIndex];
            const cleaned = cleanLine(raw);

            // Heuristics for a "valid" address line without keywords:
            // 1. Decent length
            // 2. Has spaces (multiple words)
            // 3. Not just numbers
            // 4. Not the DOB line
            if (cleaned.length > 15 && cleaned.includes(' ') && !/[0-9]{4}/.test(cleaned)) {
                // Check garbage ratio again
                const alpha = cleaned.replace(/[^a-zA-Z]/g, "").length;
                if (alpha > cleaned.length * 0.6) {
                    console.log(`Address (Positional) found: ${cleaned}`);
                    addressCandidate = cleaned;
                    break;
                }
            }
        }
    }

    console.log(`Final Parsing Result -> Name: ${nameCandidate}, Addr: ${addressCandidate}, DOB: ${dobCandidate}`);

    return {
        name: nameCandidate || null,
        address: addressCandidate || null,
        dob: dobCandidate || null
    }
}
