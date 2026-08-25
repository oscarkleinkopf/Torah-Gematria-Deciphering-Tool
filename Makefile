# Torah Gematria Deciphering Tool — local task runners (no npm required)

.PHONY: test adversarial check

test:
	node test.js

adversarial:
	node adversarial_test.js

check: test adversarial
