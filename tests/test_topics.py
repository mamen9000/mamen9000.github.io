import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'sync_repos.py'
spec = importlib.util.spec_from_file_location('sync_repos', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class TopicSyncTests(unittest.TestCase):
    def test_topic_categories_not_guessed_from_names(self):
        self.assertEqual(mod.categories(['python', 'game']), ['unclassified'])
        self.assertEqual(mod.categories(['category-game', 'category-web', 'ocr']), ['game', 'web'])
        self.assertEqual(mod.categories(['category-security', 'category-dark-labs']), ['security', 'dark-labs'])
        self.assertEqual(mod.categories(['category-game', 'category-game']), ['game'])
        self.assertEqual(mod.categories(['category-', 'category-Invalid Topic']), ['unclassified'])

    def test_public_visibility_and_forks(self):
        sample = {'name': 'example', 'topics': ['category-web']}
        self.assertIsNotNone(mod.public_repo(sample, 'LonzilFox'))
        self.assertIsNone(mod.public_repo({**sample, 'private': True}, 'LonzilFox'))
        self.assertIsNone(mod.public_repo({**sample, 'visibility': 'internal'}, 'LonzilFox'))
        self.assertIsNone(mod.public_repo({**sample, 'name': 'LonzilFox.github.io'}, 'LonzilFox'))
        self.assertIsNone(mod.public_repo({'name': 'fork', 'fork': True, 'topics': []}, 'LonzilFox'))
        self.assertIsNotNone(mod.public_repo({**sample, 'fork': True}, 'LonzilFox'))

    def test_generated_multicategory_and_preserves_readme(self):
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            (work / 'scripts').mkdir()
            (work / 'scripts' / 'sync_repos.py').write_bytes(SCRIPT.read_bytes())
            original = 'CUSTOM INTRO\n' + mod.START + '\nNOTHING\n' + mod.END + '\nCUSTOM FOOTER\n'
            (work / 'README.md').write_text(original, encoding='utf-8')
            fixture = [
                {'name': 'GameSite', 'description': 'Game world', 'topics': ['category-game', 'category-web']},
                {'name': 'CNTool', 'description': '这是中文描述', 'topics': ['category-tools']},
                {'name': 'WebGameWithoutTopics', 'description': 'game and web', 'topics': ['typescript']},
                {'name': 'Private', 'private': True, 'topics': ['category-tools']},
            ]
            path = work / 'fixture.json'
            path.write_text(json.dumps(fixture), encoding='utf-8')
            cmd = [sys.executable, str(work / 'scripts' / 'sync_repos.py'), '--target', 'site', '--fixture', str(path)]
            subprocess.run(cmd, check=True, capture_output=True)
            readme = (work / 'README.md').read_text(encoding='utf-8')
            self.assertIn('CUSTOM INTRO', readme)
            self.assertIn('CUSTOM FOOTER', readme)
            self.assertEqual(readme.count('**[GameSite]'), 2)
            self.assertIn('Unclassified', readme)
            self.assertNotIn('**[Private]', readme)
            payload = json.loads((work / 'data' / 'projects.json').read_text(encoding='utf-8'))
            self.assertEqual(len(payload['repos']), 3)
            self.assertIn('**[CNTool]', readme)
            self.assertIn('Source repository', readme)
            self.assertNotIn('这是中文描述', readme)
            self.assertNotIn('分类仅依据', readme)
            self.assertNotIn('About → Topics', readme)
            prev = readme
            subprocess.run(cmd, check=True, capture_output=True)
            self.assertEqual(prev, (work / 'README.md').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
