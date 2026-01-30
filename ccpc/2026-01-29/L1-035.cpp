// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805097018540032
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string str;
    vs arr;
    while (cin >> str, str != ".")
        arr.pb(str);
    if (arr.size() < 2)
        cout << "Momo... No one is for you ...";
    else if (arr.size() < 14)
        cout << arr[1] << " is the only one for you...";
    else
        cout << arr[1] << " and " << arr[13] << " are inviting you to dinner...";
}
