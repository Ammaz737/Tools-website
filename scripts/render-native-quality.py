import json
import pathlib
import subprocess
from PIL import Image, ImageChops, ImageStat
root = pathlib.Path('docs/quality-evidence/native-office')
poppler = pathlib.Path(r'C:/Users/Muhammad Ammaz/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
for name in ['page-images', 'editable-tables', 'spreadsheet', 'mixed-slides']:
    subprocess.run([str(poppler), '-r', '120', '-png', str(root / (name + '.pdf')), str(root / name)], check=True, capture_output=True)
subprocess.run([str(poppler), '-r', '120', '-png', 'docs/quality-evidence/pdf-to-word/source.pdf', str(root / 'source')], check=True, capture_output=True)
results=[]
for index in [1,2]:
    source=Image.open(root / f'source-{index}.png').convert('RGB')
    output=Image.open(root / f'page-images-{index}.png').convert('RGB')
    assert abs(source.width-output.width)<=1 and abs(source.height-output.height)<=1
    if output.size != source.size: output=output.resize(source.size)
    errors=ImageStat.Stat(ImageChops.difference(source,output)).mean
    assert all(value<6 for value in errors), errors
    results.append({'name':f'Word page-image native visual comparison {index}', 'status':'PASS', 'meanChannelError':errors,'threshold':6,'pixels':source.size})
slide=Image.open(root / 'mixed-slides-1.png').convert('RGB')
sample=slide.getpixel((180,240))
assert all(abs(actual-expected)<8 for actual,expected in zip(sample,(0,102,204))),sample
results.append({'name':'Mixed slide retains source blue graphic at expected position','status':'PASS','actualRGB':sample,'expectedRGB':[0,102,204]})
(root/'visual-comparison.json').write_text(json.dumps({'scope':'Poppler render and independent Pillow pixel comparison; text/table layout also requires visual inspection.', 'results':results},indent=2)+'\n')
print(json.dumps(results))
