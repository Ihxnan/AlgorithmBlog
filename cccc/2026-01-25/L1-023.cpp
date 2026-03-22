// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805113036587008
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string str;
    cin >> str;
    map<char, int> memo;
    for (auto &p : str)
        ++memo[toupper(p)];
    while (memo['G'] || memo['P'] || memo['L'] || memo['T'])
    {
        if (memo['G'])
            cout << 'G', --memo['G'];
        if (memo['P'])
            cout << 'P', --memo['P'];
        if (memo['L'])
            cout << 'L', --memo['L'];
        if (memo['T'])
            cout << 'T', --memo['T'];
    }
}
