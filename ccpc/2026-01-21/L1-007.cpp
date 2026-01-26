// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805136889593856
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

string arr[10] = {"ling", "yi", "er", "san", "si", "wu", "liu", "qi", "ba", "jiu"};

void solve()
{
    string str;
    cin >> str;
    for (int i = 0; i < str.size(); ++i)
        cout << (str[i] == '-' ? "fu" : arr[str[i] - '0']) << " \n"[i == str.size() - 1];
}
