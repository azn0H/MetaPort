import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

try:
    import fcntl
except ImportError:
    sys.modules['fcntl'] = SimpleNamespace(flock=Mock(), LOCK_EX=1, LOCK_NB=2)

spec = importlib.util.spec_from_file_location('self_update', Path(__file__).with_name('self_update.py'))
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class UpdaterTests(unittest.TestCase):
    def test_unchanged_revision_does_not_build(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(updater, 'STATE', Path(folder)):
            updater.save({'commit': 'a' * 40})
            with patch.object(updater, 'run', return_value='a' * 40 + '\trefs/heads/main') as run:
                updater.main()
            self.assertEqual(run.call_count, 1)

    def test_failed_build_never_merges_or_replaces_containers(self):
        calls = []
        def run(args, timeout=120):
            calls.append(args)
            if args[1] == 'ls-remote':
                return 'a' * 40 + '\trefs/heads/main'
            if args[1] == 'rev-parse':
                return 'a' * 40
            if args[:2] == ['docker', 'inspect']:
                return json.dumps([{'Image': 'sha256:old', 'Config': {'Env': ['SECRET=value$literal']}}])
            if 'build' in args:
                raise RuntimeError('Command failed: docker (exit 1)')
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(updater, 'STATE', Path(folder)), patch.object(updater, 'run', side_effect=run):
            with self.assertRaises(SystemExit):
                updater.main()
            status = json.loads((Path(folder) / 'status.json').read_text())
            self.assertEqual(status['status'], 'failed')
            override = json.loads(next(Path(folder).glob('control-*/override.json')).read_text())
            self.assertEqual(override['services']['metaport-backend']['environment']['SECRET'], 'value$$literal')
        self.assertFalse(any('merge' in args or 'up' in args for args in calls))


if __name__ == '__main__':
    unittest.main()
