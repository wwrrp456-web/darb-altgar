#!/bin/sh
# يشغّل كل الاختبارات ويعتمد رمز الخروج لا عدّ كلمة FAIL فقط: sh test/all.sh
cd "$(dirname "$0")/.." || exit 1
bad=0
for t in screens market lords qty tutorial maplabels learn learnengine journey journey-ui guided lore lore-ui start zakat bosses currency shops sells; do
  timeout 200 node test/$t.test.js > /tmp/t_$t.out 2>&1; code=$?
  if [ $code -ne 0 ] || grep -qE "^FAIL|ERRORS:|pageerror" /tmp/t_$t.out; then echo "✗ $t (exit $code)"; grep -E "^FAIL|ERRORS|pageerror|Error" /tmp/t_$t.out | head -3; bad=1; else echo "✓ $t"; fi
done
exit $bad
