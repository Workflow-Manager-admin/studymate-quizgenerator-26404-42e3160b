#!/bin/bash
cd /home/kavia/workspace/code-generation/studymate-quizgenerator-26404-42e3160b/study_mate_quizgenerator
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

