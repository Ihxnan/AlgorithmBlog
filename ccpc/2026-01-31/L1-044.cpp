// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805086365007872
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int k, cnt = 0;
    cin >> k;
    string str;
    map<string, string> mp{{"ChuiZi", "Bu"}, {"Bu", "JianDao"}, {"JianDao", "ChuiZi"}};
    while (cin >> str, str != "End")
    {
        if (++cnt % (k + 1) == 0)
            cout << str << endl;
        else
            cout << mp[str] << endl;
    }
}
