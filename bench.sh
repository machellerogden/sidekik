#!/usr/bin/env bash
echo "Time to process a 5MB file." | tee ./bench.txt
echo "Benchmarked with: $(sysctl -n machdep.cpu.brand_string)" | tee -a ./bench.txt
{ time bash -c "cat test_file | ./compile.js >/dev/null" 2>/dev/null; }  |& tee -a ./bench.txt
