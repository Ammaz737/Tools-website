"""Set the reviewed LibreOffice OOXML formula-load policy in a pinned worker."""
import pathlib
import re

registry = pathlib.Path('/etc/libreoffice/registry/main.xcd')
source = registry.read_text(encoding='utf-8')
pattern = r'<prop\b[^>]*\boor:name="OOXMLRecalcMode"[^>]*>.*?</prop>'
found = list(re.finditer(pattern, source, re.S))
if len(found) != 1 or found[0].group(0).count('<value>1</value>') != 1:
    raise RuntimeError('Pinned Calc registry changed; review recalculation configuration')
match = found[0]
updated = match.group(0).replace('<value>1</value>', '<value>0</value>')
registry.write_text(source[:match.start()] + updated + source[match.end():], encoding='utf-8')
print('Configured reviewed OOXML recalculation-on-load policy')
