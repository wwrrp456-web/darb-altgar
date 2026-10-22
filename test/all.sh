#!/bin/sh
# يشغّل كل الاختبارات ويعتمد رمز الخروج لا عدّ كلمة FAIL فقط: sh test/all.sh
cd "$(dirname "$0")/.." || exit 1
bad=0
for t in icons world-map map-ui navigation characters hud screens market lords qty tutorial maplabels learn learnengine journey journey-ui guided lore lore-ui start babylon babylon-ui dev header-ledger zakat bosses currency shops sells abroad save cover numerals update market2 market2-ui staff staff-ui rent rent-ui goods animals herd herd-ui breed farm farm-ui salem-ui breeds sex hybrid hybrid-ui butcher butcher-ui haggle haggle-ui factories factories-ui sound sound-ui dialogs plaza-ui shocks shocks-ui savecode savecode-ui captains captains-ui diff-ui typing-ui mounts insurance stage5a stage5a-ui pstory pstory-ui seasons rival stage5b-ui caravan-anim achievements achievements-ui cards cards-ui finance finance-ui cities-ui freeplay freeplay-ui autopilot overlay-ui typing-salem mini-ui names store-ui haggle-culture outcome-ui silver silver-ui sea sea-ui pace pace-ui routes holy holy-ui mjlis mjlis-ui zakat-an zakat-an-ui defect defect-ui hud-big calendar calendar-ui wage wage-ui guide guide-ui terms story-ui textlint tablet-ui tripprep-ui calm-ui arrival-ui receipt-ui reasons-ui scrollmem-ui help-ui office-ui insights-ui world-ui overlap-ui planner-ui; do
  timeout 200 node test/$t.test.js > /tmp/t_$t.out 2>&1; code=$?
  if [ $code -ne 0 ] || grep -qE "^FAIL|ERRORS:|pageerror" /tmp/t_$t.out; then echo "✗ $t (exit $code)"; grep -E "^FAIL|ERRORS|pageerror|Error" /tmp/t_$t.out | head -3; bad=1; else echo "✓ $t"; fi
done
exit $bad
