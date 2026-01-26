// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805130426171392
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string a, b;
    getline(cin, a);
    getline(cin, b);
    unordered_set<char> hash;
    for (char &ch : b)
        hash.insert(ch);
    for (char &ch : a)
        if (!hash.count(ch))
            cout << ch;
}
