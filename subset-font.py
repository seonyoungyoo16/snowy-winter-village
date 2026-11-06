import sys
from pathlib import Path
from urllib.request import urlretrieve
sys.path.insert(0, str(Path(__file__).parent / '.local-runs/font-tools'))
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).parent
full = root / '.local-runs/Jua-Regular.ttf'
if not full.exists():
    urlretrieve('https://raw.githubusercontent.com/google/fonts/main/ofl/jua/Jua-Regular.ttf', full)
text = ''.join((root / file).read_text(encoding='utf-8') for file in ['multiplayer.html', 'aquarium.js', 'multiplayer.js'])
chars = {ord(c) for c in text} | set(range(32, 256))
font = TTFont(full)
options = subset.Options()
options.name_IDs = ['*']
options.name_legacy = True
options.name_languages = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=chars)
subsetter.subset(font)
font.save(root / 'jua-subset.woff2')
missing = {c for c in text if '\uac00' <= c <= '\ud7a3' and ord(c) not in font.getBestCmap()}
assert not missing, ''.join(sorted(missing))
print('Font covers all aquarium UI Korean glyphs:', len(font.getBestCmap()), 'glyphs,', (root / 'jua-subset.woff2').stat().st_size, 'bytes')
