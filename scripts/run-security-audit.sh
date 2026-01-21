#!/bin/bash

# Security Audit Test Runner
# This script runs all security-related tests and generates a report

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         BALBOA TOKEN - Security Audit Test Suite          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p reports
REPORT_FILE="reports/security-audit-$(date +%Y%m%d-%H%M%S).txt"

echo "Starting security audit..." | tee $REPORT_FILE
echo "Date: $(date)" | tee -a $REPORT_FILE
echo "═══════════════════════════════════════════════════════════" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE

# Step 1: Compile contracts
echo -e "${BLUE}[1/7] Compiling contracts...${NC}"
echo "[1/7] Compiling contracts..." >> $REPORT_FILE
npx hardhat clean > /dev/null 2>&1
if npx hardhat compile >> $REPORT_FILE 2>&1; then
    echo -e "${GREEN}✓ Compilation successful${NC}"
    echo "✓ Compilation successful" >> $REPORT_FILE
else
    echo -e "${RED}✗ Compilation failed${NC}"
    echo "✗ Compilation failed" >> $REPORT_FILE
    exit 1
fi
echo "" | tee -a $REPORT_FILE

# Step 2: Run all tests
echo -e "${BLUE}[2/5] Running full test suite...${NC}"
echo "[2/5] Running full test suite..." >> $REPORT_FILE
if npx hardhat test >> $REPORT_FILE 2>&1; then
    echo -e "${GREEN}✓ All tests passed${NC}"
    echo "✓ All tests passed" >> $REPORT_FILE
else
    echo -e "${RED}✗ Some tests failed - check report${NC}"
    echo "✗ Some tests failed - check report" >> $REPORT_FILE
fi
echo "" | tee -a $REPORT_FILE

# Step 3: Generate coverage report
echo -e "${BLUE}[3/5] Generating coverage report...${NC}"
echo "[3/5] Generating coverage report..." >> $REPORT_FILE
if command -v npx &> /dev/null && npx hardhat coverage >> $REPORT_FILE 2>&1; then
    echo -e "${GREEN}✓ Coverage report generated${NC}"
    echo "✓ Coverage report generated (see coverage/ directory)" >> $REPORT_FILE
else
    echo -e "${YELLOW}⚠ Coverage generation skipped${NC}"
    echo "⚠ Coverage generation skipped" >> $REPORT_FILE
fi
echo "" | tee -a $REPORT_FILE

# Step 4: Run Solidity linter
echo -e "${BLUE}[4/5] Running Solidity linter...${NC}"
echo "[4/5] Running Solidity linter..." >> $REPORT_FILE
if npx solhint 'contracts/**/*.sol' >> $REPORT_FILE 2>&1; then
    echo -e "${GREEN}✓ No linting errors${NC}"
    echo "✓ No linting errors" >> $REPORT_FILE
else
    echo -e "${YELLOW}⚠ Linting warnings found (see report)${NC}"
    echo "⚠ Linting warnings found" >> $REPORT_FILE
fi
echo "" | tee -a $REPORT_FILE

# Step 5: Check for compilation warnings
echo -e "${BLUE}[5/5] Checking for compiler warnings...${NC}"
echo "[5/5] Checking for compiler warnings..." >> $REPORT_FILE
if npx hardhat compile 2>&1 | grep -i "warning" >> $REPORT_FILE; then
    echo -e "${YELLOW}⚠ Compiler warnings found (see report)${NC}"
    echo "⚠ Compiler warnings found" >> $REPORT_FILE
else
    echo -e "${GREEN}✓ No compiler warnings${NC}"
    echo "✓ No compiler warnings" >> $REPORT_FILE
fi
echo "" | tee -a $REPORT_FILE

# Final summary
echo "═══════════════════════════════════════════════════════════" | tee -a $REPORT_FILE
echo -e "${BLUE}Security Audit Complete${NC}" | tee -a $REPORT_FILE
echo "═══════════════════════════════════════════════════════════" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Full report saved to: $REPORT_FILE" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Next steps:" | tee -a $REPORT_FILE
echo "1. Review the test results above" | tee -a $REPORT_FILE
echo "2. Address any HIGH priority security findings" | tee -a $REPORT_FILE
echo "3. Ensure 100% test coverage for critical functions" | tee -a $REPORT_FILE
echo "4. Schedule external security audit before mainnet" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE

# Check if Slither is available
if command -v slither &> /dev/null; then
    echo -e "${BLUE}Running Slither static analysis...${NC}"
    echo "Running Slither static analysis..." >> $REPORT_FILE
    slither . >> $REPORT_FILE 2>&1 || echo "⚠ Slither analysis complete (warnings may exist)" >> $REPORT_FILE
else
    echo -e "${YELLOW}⚠ Slither not installed - skipping static analysis${NC}"
    echo "⚠ Slither not installed - install with: pip3 install slither-analyzer" | tee -a $REPORT_FILE
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}All security checks complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
