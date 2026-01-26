// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805143738892288
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    map<char, int> hash;
    string str;
    cin >> str;
    for (auto &ch : str)
        ++hash[ch];
    for (char ch = '0'; ch <= '9'; ++ch)
        if (hash.count(ch))
            cout << ch << ":" << hash[ch] << endl;
}
